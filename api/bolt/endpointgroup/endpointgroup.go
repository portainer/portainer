package endpointgroup

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoint_groups"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new instance of a service.
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := connection.CreateBucket(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// EndpointGroup returns an environment(endpoint) group by ID.
func (service *Service) EndpointGroup(ID portainer.EndpointGroupID) (*portainer.EndpointGroup, error) {
	var endpointGroup portainer.EndpointGroup
	identifier := internal.Itob(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &endpointGroup)
	if err != nil {
		return nil, err
	}

	return &endpointGroup, nil
}

// UpdateEndpointGroup updates an environment(endpoint) group.
func (service *Service) UpdateEndpointGroup(ID portainer.EndpointGroupID, endpointGroup *portainer.EndpointGroup) error {
	identifier := internal.Itob(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, endpointGroup)
}

// DeleteEndpointGroup deletes an environment(endpoint) group.
func (service *Service) DeleteEndpointGroup(ID portainer.EndpointGroupID) error {
	identifier := internal.Itob(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// EndpointGroups return an array containing all the environment(endpoint) groups.
func (service *Service) EndpointGroups() ([]portainer.EndpointGroup, error) {
	var endpointGroups = make([]portainer.EndpointGroup, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.EndpointGroup{},
		func(obj interface{}) (interface{}, error) {
			//var tag portainer.Tag
			endpointGroup, ok := obj.(*portainer.EndpointGroup)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EndpointGroup object")
				return nil, fmt.Errorf("Failed to convert to EndpointGroup object: %s", obj)
			}
			endpointGroups = append(endpointGroups, *endpointGroup)
			return &portainer.EndpointGroup{}, nil
		})

	return endpointGroups, err
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
