package git

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/osfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing/cache"
	"github.com/go-git/go-git/v5/plumbing/filemode"
	"github.com/go-git/go-git/v5/plumbing/object"
	gogitfs "github.com/go-git/go-git/v5/storage/filesystem"
	"github.com/go-git/go-git/v5/storage/memory"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

// noSymlinkFS wraps a billy.Filesystem and rejects symlink creation to prevent
// symlink traversal attacks from untrusted git repositories
type noSymlinkFS struct {
	billy.Filesystem
}

func (fs noSymlinkFS) Symlink(_, _ string) error {
	return gittypes.ErrSymlinkDetected
}

// NewNoSymlinkFS wraps fs and rejects any symlink creation
func NewNoSymlinkFS(fs billy.Filesystem) billy.Filesystem {
	return noSymlinkFS{fs}
}

type gitClient struct {
	preserveGitDirectory bool
}

func NewGitClient(preserveGitDir bool) *gitClient {
	return &gitClient{
		preserveGitDirectory: preserveGitDir,
	}
}

func (c *gitClient) Download(ctx context.Context, dst string, opt *git.CloneOptions) error {
	resolved, err := filepath.EvalSymlinks(dst)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return errors.Wrap(err, "failed to resolve destination path")
	}
	if err == nil {
		dst = resolved
	}

	wt := NewNoSymlinkFS(osfs.New(dst))
	dot := osfs.New(filesystem.JoinPaths(dst, ".git"))
	storer := gogitfs.NewStorage(dot, cache.NewObjectLRU(0))

	_, err = git.CloneContext(ctx, storer, wt, opt)
	if err != nil {
		if err.Error() == "authentication required" {
			return gittypes.ErrAuthenticationFailure
		}

		return errors.Wrap(err, "failed to clone git repository")
	}

	if c.preserveGitDirectory {
		return nil
	}

	if err := os.RemoveAll(filesystem.JoinPaths(dst, ".git")); err != nil {
		log.Error().Err(err).Msg("failed to remove .git directory")
	}

	return nil
}

func (c *gitClient) LatestCommitID(ctx context.Context, repositoryUrl, referenceName string, opt *git.ListOptions) (string, error) {
	remote := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{repositoryUrl},
	})

	refs, err := remote.ListContext(ctx, opt)
	if err != nil {
		if err.Error() == "authentication required" {
			return "", gittypes.ErrAuthenticationFailure
		}

		return "", errors.Wrap(err, "failed to list repository refs")
	}

	if referenceName == "" {
		for _, ref := range refs {
			if strings.EqualFold(ref.Name().String(), "HEAD") {
				referenceName = ref.Target().String()
			}
		}
	}

	for _, ref := range refs {
		if strings.EqualFold(ref.Name().String(), referenceName) {
			return ref.Hash().String(), nil
		}
	}

	return "", errors.Errorf("could not find ref %q in the repository", referenceName)
}

func (c *gitClient) ListRefs(ctx context.Context, repositoryUrl string, opt *git.ListOptions) ([]string, error) {
	rem := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{repositoryUrl},
	})

	refs, err := rem.ListContext(ctx, opt)
	if err != nil {
		return nil, checkGitError(err)
	}

	var ret []string
	for _, ref := range refs {
		if ref.Name().String() == "HEAD" {
			continue
		}

		ret = append(ret, ref.Name().String())
	}

	return ret, nil
}

// listFiles list all filenames under the specific repository
func (c *gitClient) ListFiles(ctx context.Context, dirOnly bool, opt *git.CloneOptions) ([]string, error) {
	repo, err := git.Clone(memory.NewStorage(), nil, opt)
	if err != nil {
		return nil, checkGitError(err)
	}

	head, err := repo.Head()
	if err != nil {
		return nil, err
	}

	commit, err := repo.CommitObject(head.Hash())
	if err != nil {
		return nil, err
	}

	tree, err := commit.Tree()
	if err != nil {
		return nil, err
	}

	var allPaths []string

	w := object.NewTreeWalker(tree, true, nil)
	defer w.Close()

	for {
		name, entry, err := w.Next()
		if err != nil {
			break
		}

		isDir := entry.Mode == filemode.Dir
		if dirOnly == isDir {
			allPaths = append(allPaths, name)
		}
	}

	return allPaths, nil
}

func checkGitError(err error) error {
	errMsg := err.Error()
	if strings.Contains(errMsg, "repository not found") {
		return gittypes.ErrIncorrectRepositoryURL
	} else if errMsg == "authentication required" {
		return gittypes.ErrAuthenticationFailure
	}

	return err
}
