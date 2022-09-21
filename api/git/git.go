package git

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/pkg/errors"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/go-git/go-git/v5/storage/memory"
)

type gitClient struct {
	preserveGitDirectory bool
}

func NewGitClient(preserveGitDir bool) *gitClient {
	return &gitClient{
		preserveGitDirectory: preserveGitDir,
	}
}

func (c *gitClient) download(ctx context.Context, dst string, opt cloneOption) error {
	gitOptions := git.CloneOptions{
		URL:   opt.repositoryUrl,
		Depth: opt.depth,
		Auth:  getAuth(opt.username, opt.password),
	}

	if opt.referenceName != "" {
		gitOptions.ReferenceName = plumbing.ReferenceName(opt.referenceName)
	}

	_, err := git.PlainCloneContext(ctx, dst, false, &gitOptions)

	if err != nil {
		if err.Error() == "authentication required" {
			return ErrAuthenticationFailure
		}
		return errors.Wrap(err, "failed to clone git repository")
	}

	if !c.preserveGitDirectory {
		os.RemoveAll(filepath.Join(dst, ".git"))
	}

	return nil
}

func (c *gitClient) latestCommitID(ctx context.Context, opt fetchOption) (string, error) {
	remote := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{opt.repositoryUrl},
	})

	listOptions := &git.ListOptions{
		Auth: getAuth(opt.username, opt.password),
	}

	refs, err := remote.List(listOptions)
	if err != nil {
		if err.Error() == "authentication required" {
			return "", ErrAuthenticationFailure
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

func getAuth(username, password string) *githttp.BasicAuth {
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

func (c *gitClient) listRefs(ctx context.Context, opt baseOption) ([]string, error) {
	rem := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{opt.repositoryUrl},
	})

	listOptions := &git.ListOptions{
		Auth: getAuth(opt.username, opt.password),
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
		URL:           opt.repositoryUrl,
		NoCheckout:    true,
		Depth:         1,
		SingleBranch:  true,
		ReferenceName: plumbing.ReferenceName(opt.referenceName),
		Auth:          getAuth(opt.username, opt.password),
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
	tree.Files().ForEach(func(f *object.File) error {
		allPaths = append(allPaths, f.Name)
		return nil
	})

	return allPaths, nil
}

func checkGitError(err error) error {
	errMsg := err.Error()
	if errMsg == "repository not found" {
		return ErrIncorrectRepositoryURL
	} else if errMsg == "authentication required" {
		return ErrAuthenticationFailure
	}
	return err
}
