package git

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/portainer/portainer/api/archive"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/go-git/go-billy/v5/osfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/filemode"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setup(t *testing.T) string {
	dir := t.TempDir()
	bareRepoDir := filesystem.JoinPaths(dir, "test-clone.git")

	file, err := os.OpenFile("./testdata/test-clone-git-repo.tar.gz", os.O_RDONLY, 0755)
	if err != nil {
		t.Fatal(errors.Wrap(err, "failed to open an archive"))
	}

	if err := archive.ExtractTarGz(file, dir); err != nil {
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
	err := service.CloneRepository(dir, repositoryURL, referenceName, "", "", gittypes.GitCredentialAuthType_Basic, false)
	require.NoError(t, err)
	assert.Equal(t, 1, getCommitHistoryLength(t, dir), "cloned repo has incorrect depth")
}

func Test_ClonePublicRepository_NoGitDirectory(t *testing.T) {
	service := Service{git: NewGitClient(false)} // no need for http client since the test access the repo via file system.
	repositoryURL := setup(t)
	referenceName := "refs/heads/main"

	dir := t.TempDir()
	t.Logf("Cloning into %s", dir)
	err := service.CloneRepository(dir, repositoryURL, referenceName, "", "", gittypes.GitCredentialAuthType_Basic, false)
	require.NoError(t, err)
	assert.NoDirExists(t, filesystem.JoinPaths(dir, ".git"))
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

	require.NoError(t, err)
	assert.Equal(t, 4, getCommitHistoryLength(t, dir), "cloned repo has incorrect depth")
}

func Test_latestCommitID(t *testing.T) {
	service := Service{git: NewGitClient(true)} // no need for http client since the test access the repo via file system.

	repositoryURL := setup(t)
	referenceName := "refs/heads/main"

	id, err := service.LatestCommitID(repositoryURL, referenceName, "", "", gittypes.GitCredentialAuthType_Basic, false)

	require.NoError(t, err)
	assert.Equal(t, "68dcaa7bd452494043c64252ab90db0f98ecf8d2", id)
}

func Test_ListRefs(t *testing.T) {
	service := Service{git: NewGitClient(true)}

	repositoryURL := setup(t)

	fs, err := service.ListRefs(repositoryURL, "", "", gittypes.GitCredentialAuthType_Basic, false, false)

	require.NoError(t, err)
	assert.Equal(t, []string{"refs/heads/main"}, fs)
}

func Test_ListFiles(t *testing.T) {
	service := Service{git: NewGitClient(true)}

	repositoryURL := setup(t)
	referenceName := "refs/heads/main"

	fs, err := service.ListFiles(
		repositoryURL,
		referenceName,
		"",
		"",
		gittypes.GitCredentialAuthType_Basic,
		false,
		false,
		[]string{".yml"},
		false,
	)

	require.NoError(t, err)
	assert.Equal(t, []string{"docker-compose.yml"}, fs)
}

func getCommitHistoryLength(t *testing.T, dir string) int {
	repo, err := git.PlainOpen(dir)
	if err != nil {
		t.Fatalf("can't open a git repo at %s with error %v", dir, err)
	}

	iter, err := repo.Log(&git.LogOptions{All: true})
	if err != nil {
		t.Fatalf("can't get a commit history iterator with error %v", err)
	}

	count := 0
	if err := iter.ForEach(func(_ *object.Commit) error {
		count++
		return nil
	}); err != nil {
		t.Fatalf("can't iterate over the commit history with error %v", err)
	}

	return count
}

func Test_noSymlinkFS_Symlink(t *testing.T) {
	fs := NewNoSymlinkFS(osfs.New(t.TempDir()))
	err := fs.Symlink("../../../etc/passwd", "evil-link")
	require.ErrorIs(t, err, gittypes.ErrSymlinkDetected)
}

func Test_noSymlinkFS_OtherOperations(t *testing.T) {
	dir := t.TempDir()
	fs := NewNoSymlinkFS(osfs.New(dir))

	f, err := fs.Create("test.txt")
	require.NoError(t, err)

	_, err = f.Write([]byte("hello"))
	require.NoError(t, err)

	err = f.Close()
	require.NoError(t, err)

	info, err := fs.Stat("test.txt")
	require.NoError(t, err)
	require.Equal(t, "test.txt", info.Name())
}

func createBareRepoWithSymlink(t *testing.T) string {
	t.Helper()

	bareDir := filesystem.JoinPaths(t.TempDir(), "symlink-repo.git")

	repo, err := git.PlainInit(bareDir, true)
	require.NoError(t, err)

	storer := repo.Storer

	fileBlob := &plumbing.MemoryObject{}
	fileBlob.SetType(plumbing.BlobObject)

	_, err = fileBlob.Write([]byte("hello world\n"))
	require.NoError(t, err)

	fileHash, err := storer.SetEncodedObject(fileBlob)
	require.NoError(t, err)

	symlinkBlob := &plumbing.MemoryObject{}
	symlinkBlob.SetType(plumbing.BlobObject)

	_, err = symlinkBlob.Write([]byte("../../../etc/passwd"))
	require.NoError(t, err)

	symlinkHash, err := storer.SetEncodedObject(symlinkBlob)
	require.NoError(t, err)

	tree := &object.Tree{
		Entries: []object.TreeEntry{
			{Name: "evil-link", Mode: filemode.Symlink, Hash: symlinkHash},
			{Name: "file.txt", Mode: filemode.Regular, Hash: fileHash},
		},
	}

	treeObj := &plumbing.MemoryObject{}

	err = tree.Encode(treeObj)
	require.NoError(t, err)

	treeHash, err := storer.SetEncodedObject(treeObj)
	require.NoError(t, err)

	sig := object.Signature{Name: "Test", Email: "test@test.com", When: time.Now()}
	commit := &object.Commit{
		Message:   "add symlink",
		Author:    sig,
		Committer: sig,
		TreeHash:  treeHash,
	}

	commitObj := &plumbing.MemoryObject{}

	err = commit.Encode(commitObj)
	require.NoError(t, err)

	commitHash, err := storer.SetEncodedObject(commitObj)
	require.NoError(t, err)

	err = storer.SetReference(plumbing.NewHashReference("refs/heads/main", commitHash))
	require.NoError(t, err)

	err = storer.SetReference(plumbing.NewSymbolicReference(plumbing.HEAD, "refs/heads/main"))
	require.NoError(t, err)

	return bareDir
}

func Test_Download_RejectsSymlink(t *testing.T) {
	client := NewGitClient(false)
	repoURL := createBareRepoWithSymlink(t)

	err := client.Download(t.Context(), t.TempDir(), &git.CloneOptions{
		URL:          repoURL,
		Depth:        1,
		SingleBranch: true,
		Tags:         git.NoTags,
	})
	require.Error(t, err)
	require.ErrorIs(t, err, gittypes.ErrSymlinkDetected)
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
				err: gittypes.ErrAuthenticationFailure,
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
				err: gittypes.ErrAuthenticationFailure,
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
				err: gittypes.ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			refs, err := client.listRefs(context.TODO(), tt.args)
			if tt.expect.err == nil {
				require.NoError(t, err)
				if tt.expect.refsCount > 0 {
					assert.NotEmpty(t, refs)
				}
			} else {
				require.Error(t, err)
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
				err:        gittypes.ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref but no credential",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateGitRepoURL,
					username:      "",
					password:      "",
				},
				referenceName: "refs/heads/main",
			},
			expect: expectResult{
				shouldFail: true,
				err:        gittypes.ErrAuthenticationFailure,
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
				err:        gittypes.ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := client.listFiles(context.TODO(), tt.args)
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
