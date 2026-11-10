package update

import (
	"errors"
	"os"
	"testing"
	"time"

	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/require"
)

func TestTmpClonesCommitID(t *testing.T) {
	t.Parallel()

	_, tc := WithTmpClones(t.Context())
	defer tc.Close()

	calls := 0
	fetch := func() (string, error) {
		calls++

		return "abc", nil
	}

	f := func(req RepoRequest, wantCalls int) {
		t.Helper()

		hash, err := tc.CommitID(req, fetch)
		require.NoError(t, err)
		require.Equal(t, "abc", hash)
		require.Equal(t, wantCalls, calls)
	}

	base := RepoRequest{URL: "https://example.com/r.git", ReferenceName: "refs/heads/main"}

	// first request fetches
	f(base, 1)

	// identical request is served from memory
	f(base, 1)

	// different reference is a different entry
	other := base
	other.ReferenceName = "refs/heads/dev"
	f(other, 2)

	// different credentials never share an entry
	authed := base
	authed.Authentication = &gittypes.GitAuthentication{Username: "u", Password: "p"}
	f(authed, 3)

	// same credentials share
	authedAgain := base
	authedAgain.Authentication = &gittypes.GitAuthentication{Username: "u", Password: "p"}
	f(authedAgain, 3)

	// different password does not share
	otherPassword := base
	otherPassword.Authentication = &gittypes.GitAuthentication{Username: "u", Password: "q"}
	f(otherPassword, 4)

	// errors are remembered as well, so a failing source is not hammered
	failing := base
	failing.URL = "https://example.com/other.git"
	failCalls := 0
	failFetch := func() (string, error) {
		failCalls++

		return "", errors.New("boom")
	}

	_, err := tc.CommitID(failing, failFetch)
	require.Error(t, err)

	_, err = tc.CommitID(failing, failFetch)
	require.Error(t, err)
	require.Equal(t, 1, failCalls)

	// nil TmpClones always fetches
	var nilClones *TmpClones
	_, err = nilClones.CommitID(base, fetch)
	require.NoError(t, err)
	require.Equal(t, 5, calls)
}

func TestTmpClonesClone(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	_, tc := WithTmpClones(t.Context())

	req := RepoRequest{URL: "https://example.com/r.git"}
	calls := 0
	clone := func(dst string) error {
		calls++

		if err := os.MkdirAll(filesystem.JoinPaths(dst, "sub"), 0o755); err != nil {
			return err
		}

		if err := os.WriteFile(filesystem.JoinPaths(dst, "sub", "run.sh"), []byte("#!/bin/sh"), 0o755); err != nil {
			return err
		}

		return os.WriteFile(filesystem.JoinPaths(dst, "compose.yml"), []byte("services: {}"), 0o644)
	}

	// two consumers of the same commit trigger a single clone
	for _, name := range []string{"a", "b"} {
		err := tc.Clone(req, "h1", root, filesystem.JoinPaths(root, name, "h1"), clone)
		require.NoError(t, err)
	}

	require.Equal(t, 1, calls)

	for _, name := range []string{"a", "b"} {
		content, err := os.ReadFile(filesystem.JoinPaths(root, name, "h1", "compose.yml"))
		require.NoError(t, err)
		require.Equal(t, "services: {}", string(content))

		info, err := os.Stat(filesystem.JoinPaths(root, name, "h1", "sub", "run.sh"))
		require.NoError(t, err)
		require.Equal(t, os.FileMode(0o755), info.Mode().Perm())
	}

	// a different commit clones again
	err := tc.Clone(req, "h2", root, filesystem.JoinPaths(root, "a", "h2"), clone)
	require.NoError(t, err)
	require.Equal(t, 2, calls)

	// a failed clone is remembered
	failReq := RepoRequest{URL: "https://example.com/bad.git"}
	failCalls := 0
	failClone := func(string) error {
		failCalls++

		return errors.New("boom")
	}

	for range 2 {
		err := tc.Clone(failReq, "h1", root, filesystem.JoinPaths(root, "c", "h1"), failClone)
		require.Error(t, err)
	}

	require.Equal(t, 1, failCalls)

	// closing removes every temporary clone, including the partial one of the failure
	tc.Close()

	entries, err := os.ReadDir(root)
	require.NoError(t, err)

	for _, e := range entries {
		require.NotContains(t, e.Name(), tmpCloneDirPrefix)
	}

	// nil TmpClones clones straight into the destination
	var nilClones *TmpClones
	dst := filesystem.JoinPaths(root, "direct")
	err = nilClones.Clone(req, "h1", root, dst, clone)
	require.NoError(t, err)
	require.FileExists(t, filesystem.JoinPaths(dst, "compose.yml"))
}

func TestTmpClonesRemovesStaleLeftovers(t *testing.T) {
	t.Parallel()

	root := t.TempDir()

	stale := filesystem.JoinPaths(root, tmpCloneDirPrefix+"stale")
	err := os.Mkdir(stale, 0o755)
	require.NoError(t, err)

	old := time.Now().Add(-2 * staleTmpCloneAge)
	err = os.Chtimes(stale, old, old)
	require.NoError(t, err)

	fresh := filesystem.JoinPaths(root, tmpCloneDirPrefix+"fresh")
	err = os.Mkdir(fresh, 0o755)
	require.NoError(t, err)

	other := filesystem.JoinPaths(root, "unrelated")
	err = os.Mkdir(other, 0o755)
	require.NoError(t, err)

	err = os.Chtimes(other, old, old)
	require.NoError(t, err)

	_, tc := WithTmpClones(t.Context())
	defer tc.Close()

	req := RepoRequest{URL: "https://example.com/r.git"}
	err = tc.Clone(req, "h1", root, filesystem.JoinPaths(root, "dst"), func(dst string) error {
		return os.WriteFile(filesystem.JoinPaths(dst, "f"), nil, 0o644)
	})
	require.NoError(t, err)

	// only the old temporary clone is removed, a recent one may belong to a tick in progress
	require.NoDirExists(t, stale)
	require.DirExists(t, fresh)
	require.DirExists(t, other)
}

func TestTmpClonesAfterClose(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	_, tc := WithTmpClones(t.Context())

	req := RepoRequest{URL: "https://example.com/r.git"}
	commits := 0
	fetch := func() (string, error) {
		commits++

		return "abc", nil
	}
	clones := 0
	clone := func(dst string) error {
		clones++

		return os.WriteFile(filesystem.JoinPaths(dst, "compose.yml"), nil, 0o644)
	}

	_, err := tc.CommitID(req, fetch)
	require.NoError(t, err)

	err = tc.Clone(req, "abc", root, filesystem.JoinPaths(root, "before"), clone)
	require.NoError(t, err)
	require.Equal(t, 1, commits)
	require.Equal(t, 1, clones)

	tc.Close()

	// a deployment that outlives the poll does not reuse the removed checkout
	_, err = tc.CommitID(req, fetch)
	require.NoError(t, err)
	require.Equal(t, 2, commits)

	after := filesystem.JoinPaths(root, "after")
	err = os.MkdirAll(after, 0o755)
	require.NoError(t, err)

	err = tc.Clone(req, "abc", root, after, clone)
	require.NoError(t, err)
	require.Equal(t, 2, clones)
	require.FileExists(t, filesystem.JoinPaths(after, "compose.yml"))

	// and it leaves no temporary clone behind
	entries, err := os.ReadDir(root)
	require.NoError(t, err)

	for _, e := range entries {
		require.NotContains(t, e.Name(), tmpCloneDirPrefix)
	}
}
