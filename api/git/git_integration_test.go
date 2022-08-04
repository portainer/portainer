package git

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/docker/docker/pkg/ioutils"
	"github.com/stretchr/testify/assert"
)

const (
	privateGitRepoURL string = "https://github.com/portainer/private-test-repository.git"
)

func TestService_ClonePrivateRepository_GitHub(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(context.TODO(), 0, 0)

	dst, err := ioutils.TempDir("", "clone")
	assert.NoError(t, err)
	defer os.RemoveAll(dst)

	repositoryUrl := privateGitRepoURL
	err = service.CloneRepository(dst, repositoryUrl, "refs/heads/main", username, accessToken)
	assert.NoError(t, err)
	assert.FileExists(t, filepath.Join(dst, "README.md"))
}

func TestService_LatestCommitID_GitHub(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(context.TODO(), 0, 0)

	repositoryUrl := privateGitRepoURL
	id, err := service.LatestCommitID(repositoryUrl, "refs/heads/main", username, accessToken)
	assert.NoError(t, err)
	assert.NotEmpty(t, id, "cannot guarantee commit id, but it should be not empty")
}

func TestService_ListRefs_GitHub(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(context.TODO(), 0, 0)

	repositoryUrl := privateGitRepoURL
	refs, err := service.ListRefs(repositoryUrl, username, accessToken)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(refs), 1)
}

func TestService_ListRefs_Github_Concurrently(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(context.TODO(), REPOSITORY_CACHE_SIZE, 200*time.Millisecond)

	repositoryUrl := privateGitRepoURL
	go service.ListRefs(repositoryUrl, username, accessToken)
	service.ListRefs(repositoryUrl, username, accessToken)

	time.Sleep(2 * time.Second)
}

func TestService_ListFiles_GitHub(t *testing.T) {
	ensureIntegrationTest(t)

	type expectResult struct {
		shouldFail   bool
		err          error
		matchedCount int
	}
	service := newService(context.TODO(), 0, 0)
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")

	tests := []struct {
		name   string
		args   option
		expect expectResult
	}{
		{
			name: "list tree with real repository and head ref but incorrect credential",
			args: option{
				repositoryUrl: privateGitRepoURL,
				referenceName: "refs/heads/main",
				username:      "test-username",
				password:      "test-token",
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref but no credential",
			args: option{
				repositoryUrl: privateGitRepoURL + "fake",
				referenceName: "refs/heads/main",
				username:      "",
				password:      "",
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref",
			args: option{
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
			args: option{
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
			args: option{
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
			args: option{
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
			args: option{
				repositoryUrl: privateGitRepoURL + "fake",
				referenceName: "refs/fake/feature",
				username:      username,
				password:      accessToken,
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := service.ListFiles(tt.args.repositoryUrl, tt.args.referenceName, tt.args.username, tt.args.password, tt.args.extensions)
			if tt.expect.shouldFail {
				assert.Error(t, err)
				if tt.expect.err != nil {
					assert.Equal(t, tt.expect.err, err)
				}
			} else {
				assert.NoError(t, err)
				if tt.expect.matchedCount > 0 {
					assert.Greater(t, len(paths), 0)
				}
			}
		})
	}
}

func TestService_ListFiles_Github_Concurrently(t *testing.T) {
	ensureIntegrationTest(t)

	repositoryUrl := privateGitRepoURL
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := newService(context.TODO(), REPOSITORY_CACHE_SIZE, 200*time.Millisecond)

	go service.ListFiles(repositoryUrl, "refs/heads/main", username, accessToken, []string{})
	service.ListFiles(repositoryUrl, "refs/heads/main", username, accessToken, []string{})

	time.Sleep(2 * time.Second)
}

func TestService_purgeCache_Github(t *testing.T) {
	ensureIntegrationTest(t)

	repositoryUrl := privateGitRepoURL
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := NewService(context.TODO())

	service.ListRefs(repositoryUrl, username, accessToken)
	service.ListFiles(repositoryUrl, "refs/heads/main", username, accessToken, []string{})

	assert.Equal(t, 1, service.repoRefCache.Len())
	assert.Equal(t, 1, service.repoFileCache.Len())

	service.purgeCache()
	assert.Equal(t, 0, service.repoRefCache.Len())
	assert.Equal(t, 0, service.repoFileCache.Len())
}

func TestService_purgeCacheByTTL_Github(t *testing.T) {
	ensureIntegrationTest(t)

	timeout := 100 * time.Millisecond
	repositoryUrl := privateGitRepoURL
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	// 40*timeout is designed for giving enough time for ListRefs and ListFiles to cache the result
	service := newService(context.TODO(), 2, 40*timeout)

	service.ListRefs(repositoryUrl, username, accessToken)
	service.ListFiles(repositoryUrl, "refs/heads/main", username, accessToken, []string{})
	assert.Equal(t, 1, service.repoRefCache.Len())
	assert.Equal(t, 1, service.repoFileCache.Len())

	// 40*timeout is designed for giving enough time for TTL being activated
	time.Sleep(40 * timeout)
	assert.Equal(t, 0, service.repoRefCache.Len())
	assert.Equal(t, 0, service.repoFileCache.Len())
}

func TestService_canStopCacheCleanTimer_whenContextDone(t *testing.T) {
	timeout := 10 * time.Millisecond
	deadlineCtx, _ := context.WithDeadline(context.TODO(), time.Now().Add(10*timeout))

	service := NewService(deadlineCtx)
	assert.False(t, service.timerHasStopped(), "timer should not be stopped")

	<-time.After(20 * timeout)

	assert.True(t, service.timerHasStopped(), "timer should be stopped")
}
