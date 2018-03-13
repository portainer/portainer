package git

import (
	"net/url"
	"strings"

	"gopkg.in/src-d/go-git.v4"
)

// Service represents a service for managing Git.
type Service struct{}

// NewService initializes a new service.
func NewService(dataStorePath string) (*Service, error) {
	service := &Service{}

	return service, nil
}

// ClonePublicRepository clones a public git repository using the specified URL in the specified
// destination folder.
func (service *Service) ClonePublicRepository(repositoryURL, destination string) error {
	return cloneRepository(repositoryURL, destination)
}

// ClonePrivateRepositoryWithBasicAuth clones a private git repository using the specified URL in the specified
// destination folder. It will use the specified username and password for basic HTTP authentication.
func (service *Service) ClonePrivateRepositoryWithBasicAuth(repositoryURL, destination, username, password string) error {
	credentials := username + ":" + url.PathEscape(password)
	repositoryURL = strings.Replace(repositoryURL, "://", "://"+credentials+"@", 1)
	return cloneRepository(repositoryURL, destination)
}

func cloneRepository(repositoryURL, destination string) error {
	_, err := git.PlainClone(destination, false, &git.CloneOptions{
		URL: repositoryURL,
	})
	return err
}
