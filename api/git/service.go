package git

import (
	"context"
	"errors"
	"sync"
	"time"
)

var (
	ErrIncorrectRepositoryURL = errors.New("Git repository could not be found, please ensure that the URL is correct.")
	ErrAuthenticationFailure  = errors.New("Authentication failed, please ensure that the git credentials are correct.")

	REPOSITORY_CACHE_SIZE = 4
	REPOSITORY_CACHE_TTL  = 30 * time.Minute
)

type option struct {
	repositoryUrl string
	username      string
	password      string
	referenceName string
	depth         int
	extensions    []string
}

type repoManager interface {
	download(ctx context.Context, dst string, opt option) error
	latestCommitID(ctx context.Context, opt option) (string, error)
	listRefs(ctx context.Context, opt option) ([]string, error)
	listFiles(ctx context.Context, opt option) ([]string, error)
	purgeCache()
}

// Service represents a service for managing Git.
type Service struct {
	shutdownCtx  context.Context
	azure        repoManager
	git          repoManager
	timerStopped bool
	mut          sync.Mutex
}

// NewService initializes a new service.
func NewService(ctx context.Context) *Service {
	service := &Service{
		shutdownCtx:  ctx,
		azure:        NewAzureClient(REPOSITORY_CACHE_SIZE),
		git:          NewGitClient(REPOSITORY_CACHE_SIZE),
		timerStopped: false,
	}
	go service.startCacheCleanTimer(REPOSITORY_CACHE_TTL)
	return service
}

// startCacheCleanTimer starts a timer to purge caches periodically
func (service *Service) startCacheCleanTimer(d time.Duration) {
	ticker := time.NewTicker(d)

	for {
		select {
		case <-ticker.C:
			if service.git != nil {
				service.git.purgeCache()
			}

			if service.azure != nil {
				service.azure.purgeCache()
			}
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
	options := option{
		repositoryUrl: repositoryURL,
		username:      username,
		password:      password,
		referenceName: referenceName,
		depth:         1,
	}

	return service.cloneRepository(destination, options)
}

func (service *Service) cloneRepository(destination string, options option) error {
	if isAzureUrl(options.repositoryUrl) {
		return service.azure.download(context.TODO(), destination, options)
	}

	return service.git.download(context.TODO(), destination, options)
}

// LatestCommitID returns SHA1 of the latest commit of the specified reference
func (service *Service) LatestCommitID(repositoryURL, referenceName, username, password string) (string, error) {
	options := option{
		repositoryUrl: repositoryURL,
		username:      username,
		password:      password,
		referenceName: referenceName,
	}

	if isAzureUrl(options.repositoryUrl) {
		return service.azure.latestCommitID(context.TODO(), options)
	}

	return service.git.latestCommitID(context.TODO(), options)
}

// ListRefs will list target repository's references without cloning the repository
func (service *Service) ListRefs(repositoryURL, username, password string) ([]string, error) {
	options := option{
		repositoryUrl: repositoryURL,
		username:      username,
		password:      password,
	}

	if isAzureUrl(options.repositoryUrl) {
		return service.azure.listRefs(context.TODO(), options)
	}

	return service.git.listRefs(context.TODO(), options)
}

// ListFiles will list all the files of the target repository with specific extensions.
// If extension is not provided, it will list all the files under the target repository
func (service *Service) ListFiles(repositoryURL, referenceName, username, password string, includedExts []string) ([]string, error) {
	options := option{
		repositoryUrl: repositoryURL,
		username:      username,
		password:      password,
		referenceName: referenceName,
		extensions:    includedExts,
	}

	if isAzureUrl(options.repositoryUrl) {
		return service.azure.listFiles(context.TODO(), options)
	}

	return service.git.listFiles(context.TODO(), options)
}
