package endpointgroup

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.EndpointGroup, portainer.EndpointGroupID]
}

// CreateEndpointGroup assign an ID to a new environment(endpoint) group and saves it.
func (service ServiceTx) Create(endpointGroup *portainer.EndpointGroup) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			endpointGroup.ID = portainer.EndpointGroupID(id)
			return int(endpointGroup.ID), endpointGroup
		},
	)
}
