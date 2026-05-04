package git

import (
	"context"
	"os"
	"strings"

	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/go-git/go-billy/v5"
	"github.com/go-git/go-billy/v5/osfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/cache"
	"github.com/go-git/go-git/v5/plumbing/filemode"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/plumbing/transport"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
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
	wt := NewNoSymlinkFS(osfs.New(dst))
	dot := osfs.New(filesystem.JoinPaths(dst, ".git"))
	storer := gogitfs.NewStorage(dot, cache.NewObjectLRU(0))

	_, err := git.CloneContext(ctx, storer, wt, opt)
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

func (c *gitClient) download(ctx context.Context, dst string, opt cloneOption) error {
	gitOptions := &git.CloneOptions{
		URL:             opt.repositoryUrl,
		Depth:           opt.depth,
		InsecureSkipTLS: opt.tlsSkipVerify,
		Auth:            getAuth(opt.authType, opt.username, opt.password),
		Tags:            git.NoTags,
	}

	if opt.referenceName != "" {
		gitOptions.ReferenceName = plumbing.ReferenceName(opt.referenceName)
	}

	return c.Download(ctx, dst, gitOptions)
}

func (c *gitClient) latestCommitID(ctx context.Context, opt fetchOption) (string, error) {
	remote := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{opt.repositoryUrl},
	})

	listOptions := &git.ListOptions{
		Auth:            getAuth(opt.authType, opt.username, opt.password),
		InsecureSkipTLS: opt.tlsSkipVerify,
	}

	refs, err := remote.List(listOptions)
	if err != nil {
		if err.Error() == "authentication required" {
			return "", gittypes.ErrAuthenticationFailure
		}

		return "", errors.Wrap(err, "failed to list repository refs")
	}

	referenceName := opt.referenceName
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

	return "", errors.Errorf("could not find ref %q in the repository", opt.referenceName)
}

func getAuth(authType gittypes.GitCredentialAuthType, username, password string) transport.AuthMethod {
	if password == "" {
		return nil
	}

	switch authType {
	case gittypes.GitCredentialAuthType_Basic:
		return getBasicAuth(username, password)
	case gittypes.GitCredentialAuthType_Token:
		return getTokenAuth(password)
	default:
		log.Warn().Msg("unknown git credentials authorization type, defaulting to None")
		return nil
	}
}

func getBasicAuth(username, password string) *githttp.BasicAuth {
	if password != "" {
		if username == "" {
			username = "token"
		}

		return &githttp.BasicAuth{
			Username: username,
			Password: password,
		}
	}
	return nil
}

func getTokenAuth(token string) *githttp.TokenAuth {
	if token != "" {
		return &githttp.TokenAuth{
			Token: token,
		}
	}
	return nil
}

func (c *gitClient) listRefs(ctx context.Context, opt baseOption) ([]string, error) {
	rem := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{opt.repositoryUrl},
	})

	listOptions := &git.ListOptions{
		Auth:            getAuth(opt.authType, opt.username, opt.password),
		InsecureSkipTLS: opt.tlsSkipVerify,
	}

	refs, err := rem.List(listOptions)
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
func (c *gitClient) listFiles(ctx context.Context, opt fetchOption) ([]string, error) {
	cloneOption := &git.CloneOptions{
		URL:             opt.repositoryUrl,
		NoCheckout:      true,
		Depth:           1,
		SingleBranch:    true,
		ReferenceName:   plumbing.ReferenceName(opt.referenceName),
		Auth:            getAuth(opt.authType, opt.username, opt.password),
		InsecureSkipTLS: opt.tlsSkipVerify,
		Tags:            git.NoTags,
	}

	repo, err := git.Clone(memory.NewStorage(), nil, cloneOption)
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
		if opt.dirOnly == isDir {
			allPaths = append(allPaths, name)
		}
	}

	return allPaths, nil
}

func checkGitError(err error) error {
	errMsg := err.Error()
	if errMsg == "repository not found" {
		return gittypes.ErrIncorrectRepositoryURL
	} else if errMsg == "authentication required" {
		return gittypes.ErrAuthenticationFailure
	}

	return err
}
