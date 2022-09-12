package git

import (
	"context"
	"errors"
	"log"
	"strings"
	"sync"
	"time"

	lru "github.com/hashicorp/golang-lru"
)

var (
	ErrIncorrectRepositoryURL = errors.New("Git repository could not be found, please ensure that the URL is correct.")
	ErrAuthenticationFailure  = errors.New("Authentication failed, please ensure that the git credentials are correct.")

	REPOSITORY_CACHE_SIZE = 4
	REPOSITORY_CACHE_TTL  = 5 * time.Minute
)

// baseOption provides a minimum group of information to operate a git repository, like git-remote
type baseOption struct {
	repositoryUrl string
	username      string
	password      string
}

// fetchOption allows to specify the reference name of the target repository
type fetchOption struct {
	baseOption
	referenceName string
}

// cloneOption allows to add a history truncated to the specified number of commits
type cloneOption struct {
	fetchOption
	depth int
}

type repoManager interface {
	download(ctx context.Context, dst string, opt cloneOption) error
	latestCommitID(ctx context.Context, opt fetchOption) (string, error)
	listRefs(ctx context.Context, opt baseOption) ([]string, error)
	listFiles(ctx context.Context, opt fetchOption) ([]string, error)
}

// Service represents a service for managing Git.
type Service struct {
	shutdownCtx  context.Context
	azure        repoManager
	git          repoManager
	timerStopped bool
	mut          sync.Mutex

	cacheEnabled bool
	// Cache the result of repository refs, key is repository URL
	repoRefCache *lru.Cache
	// Cache the result of repository file tree, key is the concatenated string of repository URL and ref value
	repoFileCache *lru.Cache
}

// NewService initializes a new service.
func NewService(ctx context.Context) *Service {
	return newService(ctx, REPOSITORY_CACHE_SIZE, REPOSITORY_CACHE_TTL)
}

func newService(ctx context.Context, cacheSize int, cacheTTL time.Duration) *Service {
	service := &Service{
		shutdownCtx:  ctx,
		azure:        NewAzureClient(),
		git:          NewGitClient(false),
		timerStopped: false,
		cacheEnabled: cacheSize > 0,
	}

	if service.cacheEnabled {
		var err error
		service.repoRefCache, err = lru.New(cacheSize)
		if err != nil {
			log.Printf("[DEBUG] [git] [message: failed to create ref cache: %v\n", err)
		}

		service.repoFileCache, err = lru.New(cacheSize)
		if err != nil {
			log.Printf("[DEBUG] [git] [message: failed to create file cache: %v\n", err)
		}

		if cacheTTL > 0 {
			go service.startCacheCleanTimer(cacheTTL)
		}
	}

	return service
}

// startCacheCleanTimer starts a timer to purge caches periodically
func (service *Service) startCacheCleanTimer(d time.Duration) {
	ticker := time.NewTicker(d)

	for {
		select {
		case <-ticker.C:
			service.purgeCache()

		case <-service.shutdownCtx.Done():
			ticker.Stop()
			service.mut.Lock()
			service.timerStopped = true
			service.mut.Unlock()
			return
		}
	}
}

// timerHasStopped shows the CacheClean timer state with thread-safe way
func (service *Service) timerHasStopped() bool {
	service.mut.Lock()
	defer service.mut.Unlock()
	ret := service.timerStopped
	return ret
}

// CloneRepository clones a git repository using the specified URL in the specified
// destination folder.
func (service *Service) CloneRepository(destination, repositoryURL, referenceName, username, password string) error {
	options := cloneOption{
		fetchOption: fetchOption{
			baseOption: baseOption{
				repositoryUrl: repositoryURL,
				username:      username,
				password:      password,
			},
			referenceName: referenceName,
		},
		depth: 1,
	}

	return service.cloneRepository(destination, options)
}

func (service *Service) cloneRepository(destination string, options cloneOption) error {
	if isAzureUrl(options.repositoryUrl) {
		return service.azure.download(context.TODO(), destination, options)
	}

	return service.git.download(context.TODO(), destination, options)
}

// LatestCommitID returns SHA1 of the latest commit of the specified reference
func (service *Service) LatestCommitID(repositoryURL, referenceName, username, password string) (string, error) {
	options := fetchOption{
		baseOption: baseOption{
			repositoryUrl: repositoryURL,
			username:      username,
			password:      password,
		},
		referenceName: referenceName,
	}

	if isAzureUrl(options.repositoryUrl) {
		return service.azure.latestCommitID(context.TODO(), options)
	}

	return service.git.latestCommitID(context.TODO(), options)
}

// ListRefs will list target repository's references without cloning the repository
func (service *Service) ListRefs(repositoryURL, username, password string, hardRefresh bool) ([]string, error) {
	if service.cacheEnabled && hardRefresh {
		// Should remove the cache explicitly, so that the following normal list can show the correct result
		service.repoRefCache.Remove(repositoryURL)
		// Remove file caches pointed to the same repository
		for _, fileCacheKey := range service.repoFileCache.Keys() {
			key, ok := fileCacheKey.(string)
			if ok {
				if strings.HasPrefix(key, repositoryURL) {
					service.repoFileCache.Remove(key)
				}
			}
		}
	}

	if service.repoRefCache != nil {
		// Lookup the refs cache first
		cache, ok := service.repoRefCache.Get(repositoryURL)
		if ok {
			refs, success := cache.([]string)
			if success {
				return refs, nil
			}
		}
	}

	options := baseOption{
		repositoryUrl: repositoryURL,
		username:      username,
		password:      password,
	}

	var (
		refs []string
		err  error
	)
	if isAzureUrl(options.repositoryUrl) {
		refs, err = service.azure.listRefs(context.TODO(), options)
		if err != nil {
			return nil, err
		}
	} else {
		refs, err = service.git.listRefs(context.TODO(), options)
		if err != nil {
			return nil, err
		}
	}

	if service.cacheEnabled && service.repoRefCache != nil {
		service.repoRefCache.Add(options.repositoryUrl, refs)
	}
	return refs, nil
}

// ListFiles will list all the files of the target repository with specific extensions.
// If extension is not provided, it will list all the files under the target repository
func (service *Service) ListFiles(repositoryURL, referenceName, username, password string, hardRefresh bool, includedExts []string) ([]string, error) {
	repoKey := generateCacheKey(repositoryURL, referenceName)

	if service.cacheEnabled && hardRefresh {
		// Should remove the cache explicitly, so that the following normal list can show the correct result
		service.repoFileCache.Remove(repoKey)
	}

	if service.repoFileCache != nil {
		// lookup the files cache first
		cache, ok := service.repoFileCache.Get(repoKey)
		if ok {
			files, success := cache.([]string)
			if success {
				// For the case while searching files in a repository without include extensions for the first time,
				// but with include extensions for the second time
				includedFiles := filterFiles(files, includedExts)
				return includedFiles, nil
			}
		}
	}

	options := fetchOption{
		baseOption: baseOption{
			repositoryUrl: repositoryURL,
			username:      username,
			password:      password,
		},
		referenceName: referenceName,
	}

	var (
		files []string
		err   error
	)
	if isAzureUrl(options.repositoryUrl) {
		files, err = service.azure.listFiles(context.TODO(), options)
		if err != nil {
			return nil, err
		}
	} else {
		files, err = service.git.listFiles(context.TODO(), options)
		if err != nil {
			return nil, err
		}
	}

	includedFiles := filterFiles(files, includedExts)
	if service.cacheEnabled && service.repoFileCache != nil {
		service.repoFileCache.Add(repoKey, includedFiles)
		return includedFiles, nil
	}
	return includedFiles, nil
}

func (service *Service) purgeCache() {
	if service.repoRefCache != nil {
		service.repoRefCache.Purge()
	}

	if service.repoFileCache != nil {
		service.repoFileCache.Purge()
	}
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

func filterFiles(paths []string, includedExts []string) []string {
	if len(includedExts) == 0 {
		return paths
	}

	var includedFiles []string
	for _, filename := range paths {
		// filter out the filenames with non-included extension
		if matchExtensions(filename, includedExts) {
			includedFiles = append(includedFiles, filename)
		}
	}
	return includedFiles
}
