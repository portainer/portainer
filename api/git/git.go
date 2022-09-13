package git

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	lru "github.com/hashicorp/golang-lru"
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
	cacheEnabled         bool
	// Cache the result of repository refs, key is repository URL
	// repoRefCache sync.Map
	// Cache the result of repository file tree, key is the concatenated string of repository URL and ref value
	repoTreeCache sync.Map
	repoRefCache  *lru.Cache
}

func NewGitClient(cacheSize int) *gitClient {
	var err error
	client := &gitClient{
		cacheEnabled: cacheSize > 0,
	}
	if cacheSize > 0 {
		client.repoRefCache, err = lru.New(cacheSize)
		if err != nil {
			log.Printf("[DEBUG] [git] [message: failed to create ref cache: %v\n", err)
		}
	}

	return client
}

func (c *gitClient) download(ctx context.Context, dst string, opt option) error {
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
		return errors.Wrap(err, "failed to clone git repository")
	}

	if !c.preserveGitDirectory {
		os.RemoveAll(filepath.Join(dst, ".git"))
	}

	return nil
}

func (c *gitClient) latestCommitID(ctx context.Context, opt option) (string, error) {
	remote := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
		Name: "origin",
		URLs: []string{opt.repositoryUrl},
	})

	listOptions := &git.ListOptions{
		Auth: getAuth(opt.username, opt.password),
	}

	refs, err := remote.List(listOptions)
	if err != nil {
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

func (c *gitClient) listRefs(ctx context.Context, opt option) ([]string, error) {
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

	if c.cacheEnabled {
		c.repoRefCache.Add(opt.repositoryUrl, ret)
		// c.repoRefCache.Store(opt.repositoryUrl, ret)

	}
	return ret, nil
}

func (c *gitClient) listFiles(ctx context.Context, opt option) ([]string, error) {
	var (
		allPaths    []string
		filteredRet []string
		err         error
		sucess      bool
	)

	repoKey := generateCacheKey(opt.repositoryUrl, opt.referenceName)
	cache, ok := c.repoTreeCache.Load(repoKey)
	if ok {
		treeCache, success := cache.([]string)
		if success {
			for _, path := range treeCache {
				if matchExtensions(path, opt.extensions) {
					filteredRet = append(filteredRet, path)
				}
			}

			return filteredRet, nil
		}
	}

	listOptions := &git.ListOptions{
		Auth: getAuth(opt.username, opt.password),
	}

	refs := make([]*plumbing.Reference, 0)

	cache, ok = c.repoRefCache.Get(opt.repositoryUrl)
	// cache, ok = c.repoRefCache.Load(opt.repositoryUrl)
	if ok {
		refs, sucess = cache.([]*plumbing.Reference)
	}

	if !ok || !sucess {
		rem := git.NewRemote(memory.NewStorage(), &config.RemoteConfig{
			Name: "origin",
			URLs: []string{opt.repositoryUrl},
		})

		refs, err = rem.List(listOptions)
		if err != nil {
			return nil, checkGitError(err)
		}
	}

	matchedRef := false
	for _, r := range refs {
		if r.Name().String() == opt.referenceName {
			matchedRef = true
			cloneOption := &git.CloneOptions{
				URL:           opt.repositoryUrl,
				NoCheckout:    true,
				Depth:         1,
				SingleBranch:  true,
				ReferenceName: r.Name(),
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

			tree.Files().ForEach(func(f *object.File) error {
				allPaths = append(allPaths, f.Name)
				if matchExtensions(f.Name, opt.extensions) {
					filteredRet = append(filteredRet, f.Name)
				}
				return nil
			})

			if c.cacheEnabled {
				c.repoTreeCache.Store(repoKey, allPaths)
			}
			break
		}
	}

	if !matchedRef {
		return nil, ErrRefNotFound
	}
	return filteredRet, nil
}

func (c *gitClient) purgeCache() {
	c.repoRefCache.Purge()

}

func generateCacheKey(names ...string) string {
	return strings.Join(names, "-")
}

func matchExtensions(target string, exts []string) bool {
	if len(exts) == 0 {
		return true
	}

	for _, ext := range exts {
		if strings.HasSuffix(target, ext) {
			return true
		}
	}
	return false
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
