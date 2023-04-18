package endpointgroup

import (
	portainer "github.com/portainer/portainer/api"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// EndpointGroup returns an environment(endpoint) group by ID.
func (service ServiceTx) EndpointGroup(ID portainer.EndpointGroupID) (*portainer.EndpointGroup, error) {
	var endpointGroup portainer.EndpointGroup
	// identifier := service.service.connection.ConvertToKey(int(ID))

	// err := service.tx.GetObject(BucketName, identifier, &endpointGroup)
	// if err != nil {
	// 	return nil, err
	// }

	return &endpointGroup, nil
}

// UpdateEndpointGroup updates an environment(endpoint) group.
func (service ServiceTx) UpdateEndpointGroup(ID portainer.EndpointGroupID, endpointGroup *portainer.EndpointGroup) error {
	// identifier := service.service.connection.ConvertToKey(int(ID))
	// return service.tx.UpdateObject(BucketName, identifier, endpointGroup)
	return nil
}

// DeleteEndpointGroup deletes an environment(endpoint) group.
func (service ServiceTx) DeleteEndpointGroup(ID portainer.EndpointGroupID) error {
	// identifier := service.service.connection.ConvertToKey(int(ID))
	// return service.tx.DeleteObject(BucketName, identifier)
	return nil
}

// EndpointGroups return an array containing all the environment(endpoint) groups.
func (service ServiceTx) EndpointGroups() ([]portainer.EndpointGroup, error) {
	var endpointGroups = make([]portainer.EndpointGroup, 0)

	return endpointGroups, nil
}

// CreateEndpointGroup assign an ID to a new environment(endpoint) group and saves it.
func (service ServiceTx) Create(endpointGroup *portainer.EndpointGroup) error {
	return nil
}
