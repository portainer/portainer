package git

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/portainer/portainer/pkg/schedule"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/transport"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	lru "github.com/hashicorp/golang-lru"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/singleflight"
)

const (
	repositoryCacheSize = 4
	repositoryCacheTTL  = 5 * time.Minute
)

type RepoManager interface {
	Download(ctx context.Context, dst string, opt *git.CloneOptions) error
	LatestCommitID(ctx context.Context, repositoryUrl, referenceName string, opt *git.ListOptions) (string, error)
	ListRefs(ctx context.Context, repositoryUrl string, opt *git.ListOptions) ([]string, error)
	ListFiles(ctx context.Context, dirOnly bool, opt *git.CloneOptions) ([]string, error)
}

// Service represents a service for managing Git.
type Service struct {
	azure RepoManager
	git   RepoManager

	cacheEnabled bool
	// Cache the result of repository refs, key is repository URL
	repoRefCache *lru.Cache
	// Cache the result of repository file tree, key is the concatenated string of repository URL and ref value
	repoFileCache *lru.Cache
}

// NewService initializes a new service.
func NewService(ctx context.Context) *Service {
	return newService(ctx, repositoryCacheSize, repositoryCacheTTL)
}

func newService(ctx context.Context, cacheSize int, cacheTTL time.Duration) *Service {
	service := &Service{
		azure:        NewAzureClient(),
		git:          NewGitClient(false),
		cacheEnabled: cacheSize > 0,
	}

	if !service.cacheEnabled {
		return service
	}

	var err error
	service.repoRefCache, err = lru.New(cacheSize)
	if err != nil {
		log.Debug().Err(err).Msg("failed to create ref cache")
	}

	service.repoFileCache, err = lru.New(cacheSize)
	if err != nil {
		log.Debug().Err(err).Msg("failed to create file cache")
	}

	if cacheTTL > 0 {
		go schedule.RunOnInterval(ctx, cacheTTL, service.purgeCache, nil)
	}

	return service
}

// CloneRepository clones a git repository using the specified URL in the specified
// destination folder.
func (service *Service) CloneRepository(
	ctx context.Context,
	destination,
	repositoryURL,
	referenceName,
	username,
	password string,
	tlsSkipVerify bool,
) error {
	return service.CloneRepositoryWithAuth(ctx, destination, repositoryURL, referenceName, GetBasicAuth(username, password), tlsSkipVerify)
}

// CloneRepositoryWithAuth clones a git repository using the specified URL in the specified
// destination folder, using the provided auth method.
func (service *Service) CloneRepositoryWithAuth(
	ctx context.Context,
	destination,
	repositoryURL,
	referenceName string,
	auth transport.AuthMethod,
	tlsSkipVerify bool,
) error {
	gitOptions := &git.CloneOptions{
		URL:             repositoryURL,
		Depth:           1,
		InsecureSkipTLS: tlsSkipVerify,
		Auth:            auth,
		Tags:            git.NoTags,
	}

	if referenceName != "" {
		gitOptions.ReferenceName = plumbing.ReferenceName(referenceName)
	}

	return service.repoManager(repositoryURL).Download(ctx, destination, gitOptions)
}

func (service *Service) repoManager(repositoryURL string) RepoManager {
	repoManager := service.git

	if IsAzureUrl(repositoryURL) {
		repoManager = service.azure
	}

	return repoManager
}

// LatestCommitID returns SHA1 of the latest commit of the specified reference
func (service *Service) LatestCommitID(
	ctx context.Context,
	repositoryURL,
	referenceName,
	username,
	password string,
	tlsSkipVerify bool,
) (string, error) {
	return service.LatestCommitIDWithAuth(ctx, repositoryURL, referenceName, GetBasicAuth(username, password), tlsSkipVerify)
}

// LatestCommitIDWithAuth returns SHA1 of the latest commit of the specified reference,
// using the provided auth method.
func (service *Service) LatestCommitIDWithAuth(
	ctx context.Context,
	repositoryURL,
	referenceName string,
	auth transport.AuthMethod,
	tlsSkipVerify bool,
) (string, error) {
	listOptions := &git.ListOptions{
		Auth:            auth,
		InsecureSkipTLS: tlsSkipVerify,
	}

	return service.repoManager(repositoryURL).LatestCommitID(ctx, repositoryURL, referenceName, listOptions)
}

// ListRefs will list target repository's references without cloning the repository
func (service *Service) ListRefs(
	ctx context.Context,
	repositoryURL,
	username,
	password string,
	hardRefresh bool,
	tlsSkipVerify bool,
) ([]string, error) {
	cacheKey := GenerateCacheKey(repositoryURL, username, password, strconv.FormatBool(tlsSkipVerify))
	return service.ListRefsWithAuth(ctx, repositoryURL, hardRefresh, GetBasicAuth(username, password), tlsSkipVerify, cacheKey)
}

// ListRefsWithAuth will list target repository's references without cloning the repository,
// using the provided auth method. The cacheKey is supplied by the caller.
func (service *Service) ListRefsWithAuth(
	ctx context.Context,
	repositoryURL string,
	hardRefresh bool,
	auth transport.AuthMethod,
	tlsSkipVerify bool,
	cacheKey string,
) ([]string, error) {
	if service.cacheEnabled && hardRefresh {
		// Should remove the cache explicitly, so that the following normal list can show the correct result
		service.repoRefCache.Remove(cacheKey)
		// Remove file caches pointed to the same repository
		for _, fileCacheKey := range service.repoFileCache.Keys() {
			if key, ok := fileCacheKey.(string); ok && strings.HasPrefix(key, repositoryURL) {
				service.repoFileCache.Remove(key)
			}
		}
	}

	if service.repoRefCache != nil {
		// Lookup the refs cache first
		if cache, ok := service.repoRefCache.Get(cacheKey); ok {
			if refs, ok := cache.([]string); ok {
				return refs, nil
			}
		}
	}

	options := &git.ListOptions{
		Auth:            auth,
		InsecureSkipTLS: tlsSkipVerify,
	}

	refs, err := service.repoManager(repositoryURL).ListRefs(ctx, repositoryURL, options)
	if err != nil {
		return nil, err
	}

	if service.cacheEnabled && service.repoRefCache != nil {
		service.repoRefCache.Add(cacheKey, refs)
	}

	return refs, nil
}

var singleflightGroup = &singleflight.Group{}

// ListFiles will list all the files of the target repository with specific extensions.
// If extension is not provided, it will list all the files under the target repository
func (service *Service) ListFiles(
	ctx context.Context,
	repositoryURL,
	referenceName,
	username,
	password string,
	dirOnly,
	hardRefresh bool,
	includedExts []string,
	tlsSkipVerify bool,
) ([]string, error) {
	cacheKey := GenerateCacheKey(
		repositoryURL,
		referenceName,
		username,
		password,
		strconv.FormatBool(tlsSkipVerify),
		strconv.FormatBool(dirOnly),
	)
	return service.ListFilesWithAuth(ctx, repositoryURL, referenceName, dirOnly, hardRefresh, GetBasicAuth(username, password), includedExts, tlsSkipVerify, cacheKey)
}

// ListFilesWithAuth will list all the files of the target repository with specific extensions,
// using the provided auth method. The cacheKey is supplied by the caller.
func (service *Service) ListFilesWithAuth(
	ctx context.Context,
	repositoryURL,
	referenceName string,
	dirOnly,
	hardRefresh bool,
	auth transport.AuthMethod,
	includedExts []string,
	tlsSkipVerify bool,
	cacheKey string,
) ([]string, error) {
	fs, err, _ := singleflightGroup.Do(cacheKey, func() (any, error) {
		return service.listFilesWithAuth(ctx, repositoryURL, referenceName, dirOnly, hardRefresh, auth, tlsSkipVerify, cacheKey)
	})

	return filterFiles(fs.([]string), includedExts), err
}

func (service *Service) listFilesWithAuth(
	ctx context.Context,
	repositoryURL,
	referenceName string,
	dirOnly,
	hardRefresh bool,
	auth transport.AuthMethod,
	tlsSkipVerify bool,
	cacheKey string,
) ([]string, error) {
	if service.cacheEnabled && hardRefresh {
		// Should remove the cache explicitly, so that the following normal list can show the correct result
		service.repoFileCache.Remove(cacheKey)
	}

	if service.repoFileCache != nil {
		// lookup the files cache first
		if cache, ok := service.repoFileCache.Get(cacheKey); ok {
			if files, ok := cache.([]string); ok {
				return files, nil
			}
		}
	}

	cloneOption := &git.CloneOptions{
		URL:             repositoryURL,
		NoCheckout:      true,
		Depth:           1,
		SingleBranch:    true,
		ReferenceName:   plumbing.ReferenceName(referenceName),
		Auth:            auth,
		InsecureSkipTLS: tlsSkipVerify,
		Tags:            git.NoTags,
	}

	files, err := service.repoManager(repositoryURL).ListFiles(ctx, dirOnly, cloneOption)
	if err != nil {
		return nil, err
	}

	if service.cacheEnabled && service.repoFileCache != nil {
		service.repoFileCache.Add(cacheKey, files)
	}

	return files, nil
}

func (service *Service) purgeCache() {
	if service.repoRefCache != nil {
		service.repoRefCache.Purge()
	}

	if service.repoFileCache != nil {
		service.repoFileCache.Purge()
	}
}

// GenerateCacheKey generates a cache key from the given parts.
func GenerateCacheKey(names ...string) string {
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

func filterFiles(paths []string, includedExts []string) []string {
	if len(includedExts) == 0 {
		return paths
	}

	var includedFiles []string
	for _, filename := range paths {
		// Filter out the filenames with non-included extension
		if matchExtensions(filename, includedExts) {
			includedFiles = append(includedFiles, filename)
		}
	}

	return includedFiles
}

func GetBasicAuth(username, password string) *githttp.BasicAuth {
	if password == "" {
		return nil
	}

	if username == "" {
		username = "token"
	}

	return &githttp.BasicAuth{
		Username: username,
		Password: password,
	}
}
