package extension

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "extension"

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

// Extension returns a extension by ID
func (service *Service) Extension(ID portainer.ExtensionID) (*portainer.Extension, error) {
	var extension portainer.Extension
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &extension)
	if err != nil {
		return nil, err
	}

	return &extension, nil
}

// Extensions return an array containing all the extensions.
func (service *Service) Extensions() ([]portainer.Extension, error) {
	var extensions = make([]portainer.Extension, 0)

	return extensions, service.connection.GetAll(
		BucketName,
		&portainer.Extension{},
		dataservices.AppendFn(&extensions),
	)

}

// Persist persists a extension inside the database.
func (service *Service) Persist(extension *portainer.Extension) error {
	return service.connection.CreateObjectWithId(BucketName, int(extension.ID), extension)
}

// DeleteExtension deletes a Extension.
func (service *Service) DeleteExtension(ID portainer.ExtensionID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
