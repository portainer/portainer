package git

import (
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
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
	service := Service{git: gitClient{preserveGitDirectory: true}} // no need for http client since the test access the repo via file system.
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
	service := Service{git: gitClient{preserveGitDirectory: false}} // no need for http client since the test access the repo via file system.
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
	service := Service{git: gitClient{preserveGitDirectory: true}} // no need for http client since the test access the repo via file system.

	repositoryURL := bareRepoDir
	referenceName := "refs/heads/main"
	destination := "shallow"

	dir, err := ioutil.TempDir("", destination)
	if err != nil {
		t.Fatalf("failed to create a temp dir")
	}
	defer os.RemoveAll(dir)
	t.Logf("Cloning into %s", dir)

	err = service.cloneRepository(dir, cloneOptions{
		repositoryUrl: repositoryURL,
		referenceName: referenceName,
		depth:         10,
	})

	assert.NoError(t, err)
	assert.Equal(t, 4, getCommitHistoryLength(t, err, dir), "cloned repo has incorrect depth")
}

func Test_latestCommitID(t *testing.T) {
	service := Service{git: gitClient{preserveGitDirectory: true}} // no need for http client since the test access the repo via file system.

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

func Test_listRemotePrivateRepository(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")

	service := Service{git: gitClient{
		preserveGitDirectory: true,
		repoRefCache:         make(map[string][]*plumbing.Reference),
		repoTreeCache:        make(map[string][]string),
	}}

	type expectResult struct {
		err       error
		refsCount int
	}

	tests := []struct {
		name        string
		url         string
		username    string
		accessToken string
		expect      expectResult
	}{
		{
			name:        "list refs of a real private repository",
			url:         privateGitRepoURL,
			username:    username,
			accessToken: accessToken,
			expect: expectResult{
				err:       nil,
				refsCount: 3,
			},
		},
		{
			name:        "list refs of a real private repository with incorrect credential",
			url:         privateGitRepoURL,
			username:    "test-username",
			accessToken: "test-token",
			expect: expectResult{
				err: ErrAuthenticationFailure,
			},
		},
		{
			name:        "list refs of a fake repository without providing credential",
			url:         privateGitRepoURL + "fake",
			username:    "",
			accessToken: "",
			expect: expectResult{
				err: ErrAuthenticationFailure,
			},
		},
		{
			name:        "list refs of a fake repository",
			url:         privateGitRepoURL + "fake",
			username:    username,
			accessToken: accessToken,
			expect: expectResult{
				err: ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			refs, err := service.ListRemote(tt.url, tt.username, tt.accessToken)
			if tt.expect.err == nil {
				assert.NoError(t, err)
				assert.Equal(t, tt.expect.refsCount, len(refs))
			} else {
				assert.Error(t, err)
				assert.Equal(t, tt.expect.err, err)
			}
		})
	}
}

func Test_listTreePrivateRepository(t *testing.T) {
	ensureIntegrationTest(t)

	service := Service{git: gitClient{
		preserveGitDirectory: true,
		cacheEnabled:         false,
		repoRefCache:         make(map[string][]*plumbing.Reference),
		repoTreeCache:        make(map[string][]string),
	}} // no need for http client since the test access the repo via file system.

	type expectResult struct {
		err          error
		matchedCount int
	}

	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")

	tests := []struct {
		name        string
		url         string
		ref         string
		username    string
		accessToken string
		exts        []string
		expect      expectResult
	}{
		{
			name:        "list tree with real repository and head ref but incorrect credential",
			url:         privateGitRepoURL,
			ref:         "refs/heads/main",
			username:    "test-username",
			accessToken: "test-token",
			exts:        []string{},
			expect: expectResult{
				err: ErrAuthenticationFailure,
			},
		},
		{
			name:        "list tree with real repository and head ref but no credential",
			url:         privateGitRepoURL + "fake",
			ref:         "refs/heads/main",
			username:    "",
			accessToken: "",
			exts:        []string{},
			expect: expectResult{
				err: ErrAuthenticationFailure,
			},
		},
		{
			name:        "list tree with real repository and head ref",
			url:         privateGitRepoURL,
			ref:         "refs/heads/main",
			username:    username,
			accessToken: accessToken,
			exts:        []string{},
			expect: expectResult{
				err:          nil,
				matchedCount: 15,
			},
		},
		{
			name:        "list tree with real repository and head ref and existing file extension",
			url:         privateGitRepoURL,
			ref:         "refs/heads/main",
			username:    username,
			accessToken: accessToken,
			exts:        []string{"yml"},
			expect: expectResult{
				err:          nil,
				matchedCount: 2,
			},
		},
		{
			name:        "list tree with real repository and head ref and non-existing file extension",
			url:         privateGitRepoURL,
			ref:         "refs/heads/main",
			username:    username,
			accessToken: accessToken,
			exts:        []string{"hcl"},
			expect: expectResult{
				err:          nil,
				matchedCount: 2,
			},
		},
		{
			name:        "list tree with real repository but non-existing ref",
			url:         privateGitRepoURL,
			ref:         "refs/fake/feature",
			username:    username,
			accessToken: accessToken,
			exts:        []string{},
			expect: expectResult{
				err: ErrRefNotFound,
			},
		},
		{
			name:        "list tree with fake repository ",
			url:         privateGitRepoURL + "fake",
			ref:         "refs/fake/feature",
			username:    username,
			accessToken: accessToken,
			exts:        []string{},
			expect: expectResult{
				err: ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := service.ListTree(tt.url, tt.ref, tt.username, tt.accessToken, tt.exts)
			if tt.expect.err == nil {
				assert.NoError(t, err)
				assert.Equal(t, tt.expect.matchedCount, len(paths))
			} else {
				assert.Error(t, err)
				assert.Equal(t, tt.expect.err, err)
			}
		})
	}
}

func Test_removeCache(t *testing.T) {
	ensureIntegrationTest(t)

	repository := privateGitRepoURL
	referenceName := "refs/heads/main"
	accessToken := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")

	client := gitClient{
		preserveGitDirectory: true,
		cacheEnabled:         true,
		repoRefCache:         make(map[string][]*plumbing.Reference),
		repoTreeCache:        make(map[string][]string),
	}
	service := Service{git: client}

	_, err := service.ListRemote(repository, username, accessToken)
	assert.NoError(t, err)
	_, ok := client.repoRefCache[repository]
	assert.Equal(t, true, ok)

	_, err = service.ListTree(repository, referenceName, username, accessToken, []string{})
	assert.NoError(t, err)
	repoKey := generateCacheKey(repository, referenceName)
	_, ok = client.repoTreeCache[repoKey]
	assert.Equal(t, true, ok)

	service.RemoveCache(repository, referenceName)
	_, ok = client.repoRefCache[repository]
	assert.Equal(t, false, ok)
	_, ok = client.repoTreeCache[repoKey]
	assert.Equal(t, false, ok)
}
