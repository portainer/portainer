package endpointgroup

import (
	"github.com/portainer/portainer/api/dataservices"
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoint_groups"
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

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: service,
		tx:      tx,
	}
}

// EndpointGroup returns an environment(endpoint) group by ID.
func (service *Service) EndpointGroup(ID portainer.EndpointGroupID) (*portainer.EndpointGroup, error) {
	var endpointGroup portainer.EndpointGroup
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &endpointGroup)
	if err != nil {
		return nil, err
	}

	return &endpointGroup, nil
}

// UpdateEndpointGroup updates an environment(endpoint) group.
func (service *Service) UpdateEndpointGroup(ID portainer.EndpointGroupID, endpointGroup *portainer.EndpointGroup) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, endpointGroup)
}

// DeleteEndpointGroup deletes an environment(endpoint) group.
func (service *Service) DeleteEndpointGroup(ID portainer.EndpointGroupID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// EndpointGroups return an array containing all the environment(endpoint) groups.
func (service *Service) EndpointGroups() ([]portainer.EndpointGroup, error) {
	var endpointGroups = make([]portainer.EndpointGroup, 0)

	return endpointGroups, service.connection.GetAll(
		BucketName,
		&portainer.EndpointGroup{},
		dataservices.AppendFn(&endpointGroups),
	)
}

// CreateEndpointGroup assign an ID to a new environment(endpoint) group and saves it.
func (service *Service) Create(endpointGroup *portainer.EndpointGroup) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			endpointGroup.ID = portainer.EndpointGroupID(id)
			return int(endpointGroup.ID), endpointGroup
		},
	)
}
