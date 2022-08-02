package git

import (
	"context"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/archive"
	"github.com/stretchr/testify/assert"
)

var bareRepoDir string

func TestMain(m *testing.M) {
	if err := testMain(m); err != nil {
		log.Fatal(err)
	}
}

// testMain does extra setup/teardown before/after testing.
// The function is separated from TestMain due to necessity to call os.Exit/log.Fatal in the latter.
func testMain(m *testing.M) error {
	dir, err := ioutil.TempDir("", "git-repo-")
	if err != nil {
		return errors.Wrap(err, "failed to create a temp dir")
	}
	defer os.RemoveAll(dir)

	bareRepoDir = filepath.Join(dir, "test-clone.git")

	file, err := os.OpenFile("./testdata/test-clone-git-repo.tar.gz", os.O_RDONLY, 0755)
	if err != nil {
		return errors.Wrap(err, "failed to open an archive")
	}
	err = archive.ExtractTarGz(file, dir)
	if err != nil {
		return errors.Wrapf(err, "failed to extract file from the archive to a folder %s\n", dir)
	}

	m.Run()

	return nil
}

func Test_ClonePublicRepository_Shallow(t *testing.T) {
	service := Service{git: &gitClient{preserveGitDirectory: true}} // no need for http client since the test access the repo via file system.
	repositoryURL := bareRepoDir
	referenceName := "refs/heads/main"
	destination := "shallow"

	dir, err := ioutil.TempDir("", destination)
	if err != nil {
		t.Fatalf("failed to create a temp dir")
	}
	defer os.RemoveAll(dir)
	t.Logf("Cloning into %s", dir)
	err = service.CloneRepository(dir, repositoryURL, referenceName, "", "")
	assert.NoError(t, err)
	assert.Equal(t, 1, getCommitHistoryLength(t, err, dir), "cloned repo has incorrect depth")
}

func Test_ClonePublicRepository_NoGitDirectory(t *testing.T) {
	service := Service{git: &gitClient{preserveGitDirectory: false}} // no need for http client since the test access the repo via file system.
	repositoryURL := bareRepoDir
	referenceName := "refs/heads/main"
	destination := "shallow"

	dir, err := ioutil.TempDir("", destination)
	if err != nil {
		t.Fatalf("failed to create a temp dir")
	}

	defer os.RemoveAll(dir)

	t.Logf("Cloning into %s", dir)
	err = service.CloneRepository(dir, repositoryURL, referenceName, "", "")
	assert.NoError(t, err)
	assert.NoDirExists(t, filepath.Join(dir, ".git"))
}

func Test_cloneRepository(t *testing.T) {
	service := Service{git: &gitClient{preserveGitDirectory: true}} // no need for http client since the test access the repo via file system.

	repositoryURL := bareRepoDir
	referenceName := "refs/heads/main"
	destination := "shallow"

	dir, err := ioutil.TempDir("", destination)
	if err != nil {
		t.Fatalf("failed to create a temp dir")
	}
	defer os.RemoveAll(dir)
	t.Logf("Cloning into %s", dir)

	err = service.cloneRepository(dir, option{
		repositoryUrl: repositoryURL,
		referenceName: referenceName,
		depth:         10,
	})

	assert.NoError(t, err)
	assert.Equal(t, 4, getCommitHistoryLength(t, err, dir), "cloned repo has incorrect depth")
}

func Test_latestCommitID(t *testing.T) {
	service := Service{git: &gitClient{preserveGitDirectory: true}} // no need for http client since the test access the repo via file system.

	repositoryURL := bareRepoDir
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

	client := &gitClient{
		preserveGitDirectory: true,
	}

	type expectResult struct {
		err       error
		refsCount int
	}

	tests := []struct {
		name   string
		args   option
		expect expectResult
	}{
		{
			name: "list refs of a real private repository",
			args: option{
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
			args: option{
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
			args: option{
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
			args: option{
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

	client := &gitClient{
		preserveGitDirectory: true,
		cacheEnabled:         false,
	}

	type expectResult struct {
		err          error
		matchedCount int
	}

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
				err: ErrAuthenticationFailure,
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
				err: ErrAuthenticationFailure,
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
				err: ErrRefNotFound,
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
				err: ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := client.listFiles(context.TODO(), tt.args)
			if tt.expect.err == nil {
				assert.NoError(t, err)
				if tt.expect.matchedCount > 0 {
					assert.Greater(t, len(paths), 0)
				}
			} else {
				assert.Error(t, err)
				assert.Equal(t, tt.expect.err, err)
			}
		})
	}
}

func Test_listRefs_Concurrently(t *testing.T) {
	ensureIntegrationTest(t)

	opt := option{
		repositoryUrl: privateGitRepoURL,
		referenceName: "refs/heads/main",
		password:      getRequiredValue(t, "GITHUB_PAT"),
		username:      getRequiredValue(t, "GITHUB_USERNAME"),
	}

	opt1 := option{
		repositoryUrl: "https://github.com/portainer/liblicense.git",
		referenceName: "refs/heads/main",
		password:      getRequiredValue(t, "GITHUB_PAT"),
		username:      getRequiredValue(t, "GITHUB_USERNAME"),
	}

	client := NewGitClient(1)

	go client.listRefs(context.TODO(), opt1)
	client.listRefs(context.TODO(), opt)

	time.Sleep(2 * time.Second)
}

func Test_listFiles_removeCache_Concurrently(t *testing.T) {
	ensureIntegrationTest(t)

	opt := option{
		repositoryUrl: privateGitRepoURL,
		referenceName: "refs/heads/main",
		password:      getRequiredValue(t, "GITHUB_PAT"),
		username:      getRequiredValue(t, "GITHUB_USERNAME"),
		extensions:    []string{},
	}

	client := &gitClient{
		preserveGitDirectory: true,
		cacheEnabled:         true,
	}

	go client.listFiles(context.TODO(), opt)
	client.listFiles(context.TODO(), opt)

	time.Sleep(2 * time.Second)
}
