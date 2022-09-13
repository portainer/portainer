package git

import (
	"context"
	"errors"
)

var (
	ErrIncorrectRepositoryURL = errors.New("Git repository could not be found, please ensure that the URL is correct.")
	ErrAuthenticationFailure  = errors.New("Authentication failed, please ensure that the git credentials are correct.")
	ErrRefNotFound            = errors.New("The target ref is not found")
)

type option struct {
	repositoryUrl string
	username      string
	password      string
	referenceName string
	depth         int
	extensions    []string
}

type downloader interface {
	download(ctx context.Context, dst string, opt option) error
	latestCommitID(ctx context.Context, opt option) (string, error)
	listRemote(ctx context.Context, opt option) ([]string, error)
	listTree(ctx context.Context, opt option) ([]string, error)
	removeCache(ctx context.Context, opt option)
}

// Service represents a service for managing Git.
type Service struct {
	azure downloader
	git   downloader
}

// NewService initializes a new service.
func NewService() *Service {
	return &Service{
		azure: NewAzureDownloader(true),
		git: &gitClient{
			cacheEnabled: true,
		},
	}
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

func (service *Service) ListRemote(repositoryURL, username, password string) ([]string, error) {
	options := option{
		repositoryUrl: repositoryURL,
		username:      username,
		password:      password,
	}

	if isAzureUrl(options.repositoryUrl) {
		return service.azure.listRemote(context.TODO(), options)
	}

	return service.git.listRemote(context.TODO(), options)
}

func (service *Service) ListTree(repositoryURL, referenceName, username, password string, includedExts []string) ([]string, error) {
	options := option{
		repositoryUrl: repositoryURL,
		username:      username,
		password:      password,
		referenceName: referenceName,
		extensions:    includedExts,
	}

	if isAzureUrl(options.repositoryUrl) {
		return service.azure.listTree(context.TODO(), options)
	}

	return service.git.listTree(context.TODO(), options)
}

func (service *Service) RemoveCache(repositoryURL, referenceName string) {
	options := option{
		repositoryUrl: repositoryURL,
		referenceName: referenceName,
	}

	if isAzureUrl(options.repositoryUrl) {
		service.azure.removeCache(context.TODO(), options)
	} else {
		service.git.removeCache(context.TODO(), options)
	}
}
