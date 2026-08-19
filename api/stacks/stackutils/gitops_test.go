package stackutils

import (
	"context"
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/git"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/require"
)

type mockGitSvc struct {
	cloneErr  error
	commitID  string
	commitErr error
}

func (m *mockGitSvc) CloneRepository(_ context.Context, _, _, _, _, _ string, _ bool) error {
	return m.cloneErr
}

func (m *mockGitSvc) LatestCommitID(_ context.Context, _, _, _, _ string, _ bool) (string, error) {
	return m.commitID, m.commitErr
}

func (m *mockGitSvc) ListRefs(_ context.Context, _, _, _ string, _ bool, _ bool) ([]string, error) {
	return nil, nil
}

func (m *mockGitSvc) ListFiles(_ context.Context, _, _, _, _ string, _, _ bool, _ []string, _ bool) ([]string, error) {
	return nil, nil
}

var _ portainer.GitService = (*mockGitSvc)(nil)

func TestDownloadGitRepository_Success(t *testing.T) {
	t.Parallel()

	svc := &mockGitSvc{commitID: "abc123"}
	cfg := gittypes.RepoConfig{
		URL:           "https://github.com/x/repo",
		ReferenceName: "refs/heads/main",
	}

	commitID, err := DownloadGitRepository(t.Context(), cfg, svc, func() string { return t.TempDir() })
	require.NoError(t, err)
	require.Equal(t, "abc123", commitID)
}

func TestDownloadGitRepository_NilAuthentication(t *testing.T) {
	t.Parallel()

	svc := &mockGitSvc{commitID: "deadbeef"}
	cfg := gittypes.RepoConfig{
		URL:            "https://github.com/x/repo",
		Authentication: nil,
	}

	commitID, err := DownloadGitRepository(t.Context(), cfg, svc, func() string { return t.TempDir() })
	require.NoError(t, err)
	require.Equal(t, "deadbeef", commitID)
}

func TestDownloadGitRepository_AuthenticationFailure(t *testing.T) {
	t.Parallel()

	svc := &mockGitSvc{cloneErr: gittypes.ErrAuthenticationFailure}
	cfg := gittypes.RepoConfig{URL: "https://github.com/x/private"}

	_, err := DownloadGitRepository(t.Context(), cfg, svc, func() string { return t.TempDir() })
	require.Error(t, err)
	require.ErrorIs(t, err, git.ErrInvalidGitCredential)
}

func TestDownloadGitRepository_OtherCloneError(t *testing.T) {
	t.Parallel()

	cloneErr := errors.New("network timeout")
	svc := &mockGitSvc{cloneErr: cloneErr}
	cfg := gittypes.RepoConfig{URL: "https://github.com/x/repo"}

	_, err := DownloadGitRepository(t.Context(), cfg, svc, func() string { return t.TempDir() })
	require.Error(t, err)
	require.ErrorIs(t, err, cloneErr)
	require.NotErrorIs(t, err, git.ErrInvalidGitCredential)
}

func TestDownloadGitRepository_LatestCommitIDError(t *testing.T) {
	t.Parallel()

	commitErr := errors.New("remote unreachable")
	svc := &mockGitSvc{commitErr: commitErr}
	cfg := gittypes.RepoConfig{URL: "https://github.com/x/repo"}

	_, err := DownloadGitRepository(t.Context(), cfg, svc, func() string { return t.TempDir() })
	require.Error(t, err)
	require.ErrorIs(t, err, commitErr)
}
