package tag

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "tags"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// Tags return an array containing all the tags.
func (service *Service) Tags() ([]portainer.Tag, error) {
	var tags = make([]portainer.Tag, 0)
	return tags, nil
}

// Tag returns a tag by ID.
func (service *Service) Tag(ID portainer.TagID) (*portainer.Tag, error) {
	var tag portainer.Tag
	return &tag, nil
}

// CreateTag creates a new tag.
func (service *Service) Create(tag *portainer.Tag) error {
	return nil
}

// UpdateTag updates a tag.
func (service *Service) UpdateTag(ID portainer.TagID, tag *portainer.Tag) error {
	return nil
}

// DeleteTag deletes a tag.
func (service *Service) DeleteTag(ID portainer.TagID) error {
	return nil
}
