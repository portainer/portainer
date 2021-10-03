package registry

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "registries"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new instance of a service.
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := internal.CreateBucket(connection, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Registry returns an registry by ID.
func (service *Service) Registry(ID portainer.RegistryID) (*portainer.Registry, error) {
	var registry portainer.Registry
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &registry)
	if err != nil {
		return nil, err
	}

	return &registry, nil
}

// Registries returns an array containing all the registries.
func (service *Service) Registries() ([]portainer.Registry, error) {
	var registries = make([]portainer.Registry, 0)

	err := internal.GetAll(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			registry, ok := obj.(portainer.Registry)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Registry object")
				return fmt.Errorf("Failed to convert to Registry object: %s", obj)
			}
			registries = append(registries, registry)
			return nil
		})

	return registries, err
}

// CreateRegistry creates a new registry.
func (service *Service) Create(registry *portainer.Registry) error {
	return internal.CreateObject(
		service.connection,
		BucketName,
		func(id uint64) (int, interface{}) {
			registry.ID = portainer.RegistryID(id)
			return int(registry.ID), registry
		},
	)
}

// UpdateRegistry updates an registry.
func (service *Service) UpdateRegistry(ID portainer.RegistryID, registry *portainer.Registry) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.connection, BucketName, identifier, registry)
}

// DeleteRegistry deletes an registry.
func (service *Service) DeleteRegistry(ID portainer.RegistryID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}
