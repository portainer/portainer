package git

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/portainer/portainer/api/archive"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
)

func setup(t *testing.T) string {
	dir := t.TempDir()
	bareRepoDir := filepath.Join(dir, "test-clone.git")

	file, err := os.OpenFile("./testdata/test-clone-git-repo.tar.gz", os.O_RDONLY, 0755)
	if err != nil {
		t.Fatal(errors.Wrap(err, "failed to open an archive"))
	}

	err = archive.ExtractTarGz(file, dir)
	if err != nil {
		t.Fatal(errors.Wrapf(err, "failed to extract file from the archive to a folder %s", dir))
	}

	return bareRepoDir
}

func Test_ClonePublicRepository_Shallow(t *testing.T) {
	service := Service{git: NewGitClient(true)} // no need for http client since the test access the repo via file system.
	repositoryURL := setup(t)
	referenceName := "refs/heads/main"

	dir := t.TempDir()
	t.Logf("Cloning into %s", dir)
	err := service.CloneRepository(dir, repositoryURL, referenceName, "", "")
	assert.NoError(t, err)
	assert.Equal(t, 1, getCommitHistoryLength(t, err, dir), "cloned repo has incorrect depth")
}

func Test_ClonePublicRepository_NoGitDirectory(t *testing.T) {
	service := Service{git: NewGitClient(false)} // no need for http client since the test access the repo via file system.
	repositoryURL := setup(t)
	referenceName := "refs/heads/main"

	dir := t.TempDir()
	t.Logf("Cloning into %s", dir)
	err := service.CloneRepository(dir, repositoryURL, referenceName, "", "")
	assert.NoError(t, err)
	assert.NoDirExists(t, filepath.Join(dir, ".git"))
}

func Test_cloneRepository(t *testing.T) {
	service := Service{git: NewGitClient(true)} // no need for http client since the test access the repo via file system.

	repositoryURL := setup(t)
	referenceName := "refs/heads/main"

	dir := t.TempDir()
	t.Logf("Cloning into %s", dir)

	err := service.cloneRepository(dir, cloneOption{
		fetchOption: fetchOption{
			baseOption: baseOption{
				repositoryUrl: repositoryURL,
			},
			referenceName: referenceName,
		},
		depth: 10,
	})

	assert.NoError(t, err)
	assert.Equal(t, 4, getCommitHistoryLength(t, err, dir), "cloned repo has incorrect depth")
}

func Test_latestCommitID(t *testing.T) {
	service := Service{git: NewGitClient(true)} // no need for http client since the test access the repo via file system.

	repositoryURL := setup(t)
	referenceName := "refs/heads/main"

	id, err := service.LatestCommitID(repositoryURL, referenceName, "", "")

	assert.NoError(t, err)
	assert.Equal(t, "68dcaa7bd452494043c64252ab90db0f98ecf8d2", id)
}

func getCommitHistoryLength(t *testing.T, err error, dir string) int {
	repo, err := git.PlainOpen(dir)
	if err != nil {
		t.Fatalf("can't open a git repo at %s with error %v", dir, err)
	}
	iter, err := repo.Log(&git.LogOptions{All: true})
	if err != nil {
		t.Fatalf("can't get a commit history iterator with error %v", err)
	}
	count := 0
	err = iter.ForEach(func(_ *object.Commit) error {
		count++
		return nil
	})
	if err != nil {
		t.Fatalf("can't iterate over the commit history with error %v", err)
	}
	return count
}

func Test_listRefsPrivateRepository(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")

	client := NewGitClient(false)

	type expectResult struct {
		err       error
		refsCount int
	}

	tests := []struct {
		name   string
		args   baseOption
		expect expectResult
	}{
		{
			name: "list refs of a real private repository",
			args: baseOption{
				repositoryUrl: privateGitRepoURL,
				username:      username,
				password:      accessToken,
			},
			expect: expectResult{
				err:       nil,
				refsCount: 2,
			},
		},
		{
			name: "list refs of a real private repository with incorrect credential",
			args: baseOption{
				repositoryUrl: privateGitRepoURL,
				username:      "test-username",
				password:      "test-token",
			},
			expect: expectResult{
				err: ErrAuthenticationFailure,
			},
		},
		{
			name: "list refs of a fake repository without providing credential",
			args: baseOption{
				repositoryUrl: privateGitRepoURL + "fake",
				username:      "",
				password:      "",
			},
			expect: expectResult{
				err: ErrAuthenticationFailure,
			},
		},
		{
			name: "list refs of a fake repository",
			args: baseOption{
				repositoryUrl: privateGitRepoURL + "fake",
				username:      username,
				password:      accessToken,
			},
			expect: expectResult{
				err: ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			refs, err := client.listRefs(context.TODO(), tt.args)
			if tt.expect.err == nil {
				assert.NoError(t, err)
				if tt.expect.refsCount > 0 {
					assert.Greater(t, len(refs), 0)
				}
			} else {
				assert.Error(t, err)
				assert.Equal(t, tt.expect.err, err)
			}
		})
	}
}

func Test_listFilesPrivateRepository(t *testing.T) {
	ensureIntegrationTest(t)

	client := NewGitClient(false)

	type expectResult struct {
		shouldFail   bool
		err          error
		matchedCount int
	}

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")

	tests := []struct {
		name   string
		args   fetchOption
		expect expectResult
	}{
		{
			name: "list tree with real repository and head ref but incorrect credential",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateGitRepoURL,
					username:      "test-username",
					password:      "test-token",
				},
				referenceName: "refs/heads/main",
			},
			expect: expectResult{
				shouldFail: true,
				err:        ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref but no credential",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateGitRepoURL + "fake",
					username:      "",
					password:      "",
				},
				referenceName: "refs/heads/main",
			},
			expect: expectResult{
				shouldFail: true,
				err:        ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateGitRepoURL,
					username:      username,
					password:      accessToken,
				},
				referenceName: "refs/heads/main",
			},
			expect: expectResult{
				err:          nil,
				matchedCount: 15,
			},
		},
		{
			name: "list tree with real repository but non-existing ref",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateGitRepoURL,
					username:      username,
					password:      accessToken,
				},
				referenceName: "refs/fake/feature",
			},
			expect: expectResult{
				shouldFail: true,
			},
		},
		{
			name: "list tree with fake repository ",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateGitRepoURL + "fake",
					username:      username,
					password:      accessToken,
				},
				referenceName: "refs/fake/feature",
			},
			expect: expectResult{
				shouldFail: true,
				err:        ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := client.listFiles(context.TODO(), tt.args)
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
