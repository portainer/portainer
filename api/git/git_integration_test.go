package git

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	privateGitRepoURL string = "https://github.com/portainer/private-test-repository.git"
)

func TestService_ClonePrivateRepository_GitHub(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(t.Context(), 0, 0)

	dst := t.TempDir()

	repositoryUrl := privateGitRepoURL
	err := service.CloneRepository(
		t.Context(),
		dst,
		repositoryUrl,
		"refs/heads/main",
		username,
		accessToken,
		false,
	)
	require.NoError(t, err)
	assert.FileExists(t, filesystem.JoinPaths(dst, "README.md"))
}

func TestService_LatestCommitID_GitHub(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(t.Context(), 0, 0)

	repositoryUrl := privateGitRepoURL
	id, err := service.LatestCommitID(
		t.Context(),
		repositoryUrl,
		"refs/heads/main",
		username,
		accessToken,
		false,
	)
	require.NoError(t, err)
	assert.NotEmpty(t, id, "cannot guarantee commit id, but it should be not empty")
}

func TestService_ListRefs_GitHub(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(t.Context(), 0, 0)

	repositoryUrl := privateGitRepoURL
	refs, err := service.ListRefs(t.Context(), repositoryUrl, username, accessToken, false, false)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(refs), 1)
}

func TestService_ListRefs_Github_Concurrently(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(t.Context(), repositoryCacheSize, 200*time.Millisecond)

	repositoryUrl := privateGitRepoURL
	go func() {
		_, _ = service.ListRefs(t.Context(), repositoryUrl, username, accessToken, false, false)
	}()

	_, err := service.ListRefs(t.Context(), repositoryUrl, username, accessToken, false, false)
	require.NoError(t, err)

	time.Sleep(2 * time.Second)
}

func TestService_ListFiles_GitHub(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	type args struct {
		repositoryUrl string
		referenceName string
		username      string
		password      string
		extensions    []string
	}

	type expectResult struct {
		shouldFail   bool
		err          error
		matchedCount int
	}
	service := newService(t.Context(), 0, 0)
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")

	tests := []struct {
		name   string
		args   args
		expect expectResult
	}{
		{
			name: "list tree with real repository and head ref but incorrect credential",
			args: args{
				repositoryUrl: privateGitRepoURL,
				referenceName: "refs/heads/main",
				username:      "test-username",
				password:      "test-token",
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        gittypes.ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref but no credential",
			args: args{
				repositoryUrl: privateGitRepoURL + "fake",
				referenceName: "refs/heads/main",
				username:      "",
				password:      "",
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        gittypes.ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref",
			args: args{
				repositoryUrl: privateGitRepoURL,
				referenceName: "refs/heads/main",
				username:      username,
				password:      accessToken,
				extensions:    []string{},
			},
			expect: expectResult{
				err:          nil,
				matchedCount: 15,
			},
		},
		{
			name: "list tree with real repository and head ref and existing file extension",
			args: args{
				repositoryUrl: privateGitRepoURL,
				referenceName: "refs/heads/main",
				username:      username,
				password:      accessToken,
				extensions:    []string{"yml"},
			},
			expect: expectResult{
				err:          nil,
				matchedCount: 2,
			},
		},
		{
			name: "list tree with real repository and head ref and non-existing file extension",
			args: args{
				repositoryUrl: privateGitRepoURL,
				referenceName: "refs/heads/main",
				username:      username,
				password:      accessToken,
				extensions:    []string{"hcl"},
			},
			expect: expectResult{
				err:          nil,
				matchedCount: 2,
			},
		},
		{
			name: "list tree with real repository but non-existing ref",
			args: args{
				repositoryUrl: privateGitRepoURL,
				referenceName: "refs/fake/feature",
				username:      username,
				password:      accessToken,
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
			},
		},
		{
			name: "list tree with fake repository ",
			args: args{
				repositoryUrl: privateGitRepoURL + "fake",
				referenceName: "refs/fake/feature",
				username:      username,
				password:      accessToken,
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        gittypes.ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := service.ListFiles(
				t.Context(),
				tt.args.repositoryUrl,
				tt.args.referenceName,
				tt.args.username,
				tt.args.password,
				false,
				false,
				tt.args.extensions,
				false,
			)
			if tt.expect.shouldFail {
				require.Error(t, err)
				if tt.expect.err != nil {
					assert.Equal(t, tt.expect.err, err)
				}
			} else {
				require.NoError(t, err)
				if tt.expect.matchedCount > 0 {
					assert.NotEmpty(t, paths)
				}
			}
		})
	}
}

func TestService_ListFiles_Github_Concurrently(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	repositoryUrl := privateGitRepoURL
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(t.Context(), repositoryCacheSize, 200*time.Millisecond)

	go func() {
		_, _ = service.ListFiles(
			t.Context(),
			repositoryUrl,
			"refs/heads/main",
			username,
			accessToken,
			false,
			false,
			[]string{},
			false,
		)
	}()

	_, err := service.ListFiles(
		t.Context(),
		repositoryUrl,
		"refs/heads/main",
		username,
		accessToken,
		false,
		false,
		[]string{},
		false,
	)
	require.NoError(t, err)

	time.Sleep(2 * time.Second)
}

func TestService_purgeCache_Github(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	repositoryUrl := privateGitRepoURL
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := NewService(t.Context())

	_, err := service.ListRefs(t.Context(), repositoryUrl, username, accessToken, false, false)
	require.NoError(t, err)

	_, err = service.ListFiles(
		t.Context(),
		repositoryUrl,
		"refs/heads/main",
		username,
		accessToken,
		false,
		false,
		[]string{},
		false,
	)
	require.NoError(t, err)

	assert.Equal(t, 1, service.repoRefCache.Len())
	assert.Equal(t, 1, service.repoFileCache.Len())

	service.purgeCache()
	assert.Equal(t, 0, service.repoRefCache.Len())
	assert.Equal(t, 0, service.repoFileCache.Len())
}

func TestService_purgeCacheByTTL_Github(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	timeout := 100 * time.Millisecond
	repositoryUrl := privateGitRepoURL
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	// 40*timeout is designed for giving enough time for ListRefs and ListFiles to cache the result
	service := newService(t.Context(), 2, 40*timeout)

	_, err := service.ListRefs(t.Context(), repositoryUrl, username, accessToken, false, false)
	require.NoError(t, err)
	_, err = service.ListFiles(
		t.Context(),
		repositoryUrl,
		"refs/heads/main",
		username,
		accessToken,
		false,
		false,
		[]string{},
		false,
	)
	require.NoError(t, err)
	assert.Equal(t, 1, service.repoRefCache.Len())
	assert.Equal(t, 1, service.repoFileCache.Len())

	// 40*timeout is designed for giving enough time for TTL being activated
	time.Sleep(40 * timeout)
	assert.Equal(t, 0, service.repoRefCache.Len())
	assert.Equal(t, 0, service.repoFileCache.Len())
}

func TestService_HardRefresh_ListRefs_GitHub(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(t.Context(), 2, 0)

	repositoryUrl := privateGitRepoURL
	refs, err := service.ListRefs(t.Context(), repositoryUrl, username, accessToken, false, false)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(refs), 1)
	assert.Equal(t, 1, service.repoRefCache.Len())

	_, err = service.ListRefs(t.Context(), repositoryUrl, username, "fake-token", false, false)
	require.Error(t, err)
	assert.Equal(t, 1, service.repoRefCache.Len())
}

func TestService_HardRefresh_ListRefs_And_RemoveAllCaches_GitHub(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(t.Context(), 2, 0)

	repositoryUrl := privateGitRepoURL
	refs, err := service.ListRefs(t.Context(), repositoryUrl, username, accessToken, false, false)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(refs), 1)
	assert.Equal(t, 1, service.repoRefCache.Len())

	files, err := service.ListFiles(
		t.Context(),
		repositoryUrl,
		"refs/heads/main",
		username,
		accessToken,
		false,
		false,
		[]string{},
		false,
	)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(files), 1)
	assert.Equal(t, 1, service.repoFileCache.Len())

	files, err = service.ListFiles(
		t.Context(),
		repositoryUrl,
		"refs/heads/test",
		username,
		accessToken,
		false,
		false,
		[]string{},
		false,
	)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(files), 1)
	assert.Equal(t, 2, service.repoFileCache.Len())

	_, err = service.ListRefs(t.Context(), repositoryUrl, username, "fake-token", false, false)
	require.Error(t, err)
	assert.Equal(t, 1, service.repoRefCache.Len())

	_, err = service.ListRefs(t.Context(), repositoryUrl, username, "fake-token", true, false)
	require.Error(t, err)
	assert.Equal(t, 1, service.repoRefCache.Len())
	// The relevant file caches should be removed too
	assert.Equal(t, 0, service.repoFileCache.Len())
}

func TestService_HardRefresh_ListFiles_GitHub(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	service := newService(t.Context(), 2, 0)
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	repositoryUrl := privateGitRepoURL
	files, err := service.ListFiles(
		t.Context(),
		repositoryUrl,
		"refs/heads/main",
		username,
		accessToken,
		false,
		false,
		[]string{},
		false,
	)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(files), 1)
	assert.Equal(t, 1, service.repoFileCache.Len())

	_, err = service.ListFiles(
		t.Context(),
		repositoryUrl,
		"refs/heads/main",
		username,
		"fake-token",
		false,
		true,
		[]string{},
		false,
	)
	require.Error(t, err)
	assert.Equal(t, 0, service.repoFileCache.Len())
}

func TestService_CloneRepository_TokenAuth(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	service := newService(t.Context(), 2, 0)
	var requests []*http.Request
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests = append(requests, r)
	}))
	accessToken := "test_access_token"
	username := "test_username"
	repositoryUrl := testServer.URL

	// Since we aren't hitting a real git server we ignore the error
	_ = service.CloneRepository(
		t.Context(),
		"test_dir",
		repositoryUrl,
		"refs/heads/main",
		username,
		accessToken,
		false,
	)

	testServer.Close()

	if len(requests) != 1 {
		t.Fatalf("expected 1 request sent but got %d", len(requests))
	}

	gotAuthHeader := requests[0].Header.Get("Authorization")
	if gotAuthHeader == "" {
		t.Fatal("no Authorization header in git request")
	}

	expectedAuthHeader := "Bearer test_access_token"
	if gotAuthHeader != expectedAuthHeader {
		t.Fatalf("expected Authorization header %q but got %q", expectedAuthHeader, gotAuthHeader)
	}
}
