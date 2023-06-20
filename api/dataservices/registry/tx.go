package registry

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// Registry returns a registry by ID.
func (service ServiceTx) Registry(ID portainer.RegistryID) (*portainer.Registry, error) {
	var registry portainer.Registry
	identifier := service.service.connection.ConvertToKey(int(ID))

	err := service.tx.GetObject(BucketName, identifier, &registry)
	if err != nil {
		return nil, err
	}

	return &registry, nil
}

// Registries returns an array containing all the registries.
func (service ServiceTx) Registries() ([]portainer.Registry, error) {
	var registries = make([]portainer.Registry, 0)

	return registries, service.tx.GetAll(
		BucketName,
		&portainer.Registry{},
		dataservices.AppendFn(&registries),
	)
}

// Create creates a new registry.
func (service ServiceTx) Create(registry *portainer.Registry) error {
	return service.tx.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			registry.ID = portainer.RegistryID(id)
			return int(registry.ID), registry
		},
	)
}

// UpdateRegistry updates a registry.
func (service ServiceTx) UpdateRegistry(ID portainer.RegistryID, registry *portainer.Registry) error {
	identifier := service.service.connection.ConvertToKey(int(ID))
	return service.tx.UpdateObject(BucketName, identifier, registry)
}

// DeleteRegistry deletes a registry.
func (service ServiceTx) DeleteRegistry(ID portainer.RegistryID) error {
	identifier := service.service.connection.ConvertToKey(int(ID))
	return service.tx.DeleteObject(BucketName, identifier)
}
