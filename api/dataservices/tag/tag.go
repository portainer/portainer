package tag

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
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
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Tags return an array containing all the tags.
func (service *Service) Tags() ([]portainer.Tag, error) {
	var tags = make([]portainer.Tag, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Tag{},
		func(obj interface{}) (interface{}, error) {
			tag, ok := obj.(*portainer.Tag)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Tag object")
				return nil, fmt.Errorf("Failed to convert to Tag object: %s", obj)
			}
			tags = append(tags, *tag)
			return &portainer.Tag{}, nil
		})

	return tags, err
}

// Tag returns a tag by ID.
func (service *Service) Tag(ID portainer.TagID) (*portainer.Tag, error) {
	var tag portainer.Tag
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &tag)
	if err != nil {
		return nil, err
	}

	return &tag, nil
}

// CreateTag creates a new tag.
func (service *Service) Create(tag *portainer.Tag) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			tag.ID = portainer.TagID(id)
			return int(tag.ID), tag
		},
	)
}

// UpdateTag updates a tag.
func (service *Service) UpdateTag(ID portainer.TagID, tag *portainer.Tag) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, tag)
}

// DeleteTag deletes a tag.
func (service *Service) DeleteTag(ID portainer.TagID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
