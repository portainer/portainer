package git

import (
	"gopkg.in/src-d/go-git.v4"
)

// Service represents a service for managing Git.
type Service struct{}

// NewService initializes a new service.
func NewService(dataStorePath string) (*Service, error) {
	service := &Service{}

	return service, nil
}

// CloneRepository clones a git repository using the specified URL in the specified
// destination folder.
func (service *Service) CloneRepository(url, destination string) error {
	_, err := git.PlainClone(destination, false, &git.CloneOptions{
		URL: url,
	})

	return err
}
