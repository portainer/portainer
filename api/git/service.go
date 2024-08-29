package git

import (
	"context"
	"strconv"
	"strings"
	"sync"
	"time"

	lru "github.com/hashicorp/golang-lru"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/singleflight"
)

const (
	repositoryCacheSize = 4
	repositoryCacheTTL  = 5 * time.Minute
)

// baseOption provides a minimum group of information to operate a git repository, like git-remote
type baseOption struct {
	repositoryUrl string
	username      string
	password      string
	tlsSkipVerify bool
}

// fetchOption allows to specify the reference name of the target repository
type fetchOption struct {
	baseOption
	referenceName string
	dirOnly       bool
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
	return newService(ctx, repositoryCacheSize, repositoryCacheTTL)
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
			log.Debug().Err(err).Msg("failed to create ref cache")
		}

		service.repoFileCache, err = lru.New(cacheSize)
		if err != nil {
			log.Debug().Err(err).Msg("failed to create file cache")
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
func (service *Service) CloneRepository(destination, repositoryURL, referenceName, username, password string, tlsSkipVerify bool) error {
	options := cloneOption{
		fetchOption: fetchOption{
			baseOption: baseOption{
				repositoryUrl: repositoryURL,
				username:      username,
				password:      password,
				tlsSkipVerify: tlsSkipVerify,
			},
			referenceName: referenceName,
		},
		depth: 1,
	}

	return service.cloneRepository(destination, options)
}

func (service *Service) repoManager(options baseOption) repoManager {
	repoManager := service.git

	if isAzureUrl(options.repositoryUrl) {
		repoManager = service.azure
	}

	return repoManager
}

func (service *Service) cloneRepository(destination string, options cloneOption) error {
	return service.repoManager(options.baseOption).download(context.TODO(), destination, options)
}

// LatestCommitID returns SHA1 of the latest commit of the specified reference
func (service *Service) LatestCommitID(repositoryURL, referenceName, username, password string, tlsSkipVerify bool) (string, error) {
	options := fetchOption{
		baseOption: baseOption{
			repositoryUrl: repositoryURL,
			username:      username,
			password:      password,
			tlsSkipVerify: tlsSkipVerify,
		},
		referenceName: referenceName,
	}

	return service.repoManager(options.baseOption).latestCommitID(context.TODO(), options)
}

// ListRefs will list target repository's references without cloning the repository
func (service *Service) ListRefs(repositoryURL, username, password string, hardRefresh bool, tlsSkipVerify bool) ([]string, error) {
	refCacheKey := generateCacheKey(repositoryURL, username, password, strconv.FormatBool(tlsSkipVerify))
	if service.cacheEnabled && hardRefresh {
		// Should remove the cache explicitly, so that the following normal list can show the correct result
		service.repoRefCache.Remove(refCacheKey)
		// Remove file caches pointed to the same repository
		for _, fileCacheKey := range service.repoFileCache.Keys() {
			if key, ok := fileCacheKey.(string); ok && strings.HasPrefix(key, repositoryURL) {
				service.repoFileCache.Remove(key)
			}
		}
	}

	if service.repoRefCache != nil {
		// Lookup the refs cache first
		if cache, ok := service.repoRefCache.Get(refCacheKey); ok {
			if refs, ok := cache.([]string); ok {
				return refs, nil
			}
		}
	}

	options := baseOption{
		repositoryUrl: repositoryURL,
		username:      username,
		password:      password,
		tlsSkipVerify: tlsSkipVerify,
	}

	refs, err := service.repoManager(options).listRefs(context.TODO(), options)
	if err != nil {
		return nil, err
	}

	if service.cacheEnabled && service.repoRefCache != nil {
		service.repoRefCache.Add(refCacheKey, refs)
	}

	return refs, nil
}

var singleflightGroup = &singleflight.Group{}

// ListFiles will list all the files of the target repository with specific extensions.
// If extension is not provided, it will list all the files under the target repository
func (service *Service) ListFiles(repositoryURL, referenceName, username, password string, dirOnly, hardRefresh bool, includedExts []string, tlsSkipVerify bool) ([]string, error) {
	repoKey := generateCacheKey(repositoryURL, referenceName, username, password, strconv.FormatBool(tlsSkipVerify), strconv.FormatBool(dirOnly))

	fs, err, _ := singleflightGroup.Do(repoKey, func() (any, error) {
		return service.listFiles(repositoryURL, referenceName, username, password, dirOnly, hardRefresh, tlsSkipVerify)
	})

	return filterFiles(fs.([]string), includedExts), err
}

func (service *Service) listFiles(repositoryURL, referenceName, username, password string, dirOnly, hardRefresh bool, tlsSkipVerify bool) ([]string, error) {
	repoKey := generateCacheKey(repositoryURL, referenceName, username, password, strconv.FormatBool(tlsSkipVerify), strconv.FormatBool(dirOnly))

	if service.cacheEnabled && hardRefresh {
		// Should remove the cache explicitly, so that the following normal list can show the correct result
		service.repoFileCache.Remove(repoKey)
	}

	if service.repoFileCache != nil {
		// lookup the files cache first
		if cache, ok := service.repoFileCache.Get(repoKey); ok {
			if files, ok := cache.([]string); ok {
				return files, nil
			}
		}
	}

	options := fetchOption{
		baseOption: baseOption{
			repositoryUrl: repositoryURL,
			username:      username,
			password:      password,
			tlsSkipVerify: tlsSkipVerify,
		},
		referenceName: referenceName,
		dirOnly:       dirOnly,
	}

	files, err := service.repoManager(options.baseOption).listFiles(context.TODO(), options)
	if err != nil {
		return nil, err
	}

	if service.cacheEnabled && service.repoFileCache != nil {
		service.repoFileCache.Add(repoKey, files)
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
		// Filter out the filenames with non-included extension
		if matchExtensions(filename, includedExts) {
			includedFiles = append(includedFiles, filename)
		}
	}

	return includedFiles
}
