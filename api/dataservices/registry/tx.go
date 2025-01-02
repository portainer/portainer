package registry

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.Registry, portainer.RegistryID]
}

// Create creates a new registry.
func (service ServiceTx) Create(registry *portainer.Registry) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			registry.ID = portainer.RegistryID(id)
			return int(registry.ID), registry
		},
	)
}
