package endpointrelation

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoint_relations"
)

// Service represents a service for managing environment(endpoint) relation data.
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

//EndpointRelations returns an array of all EndpointRelations
func (service *Service) EndpointRelations() ([]portainer.EndpointRelation, error) {
	var all = make([]portainer.EndpointRelation, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.EndpointRelation{},
		func(obj interface{}) (interface{}, error) {
			r, ok := obj.(*portainer.EndpointRelation)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to EndpointRelation object")
				return nil, fmt.Errorf("Failed to convert to EndpointRelation object: %s", obj)
			}
			all = append(all, *r)
			return &portainer.EndpointRelation{}, nil
		})

	return all, err
}

// EndpointRelation returns a Environment(Endpoint) relation object by EndpointID
func (service *Service) EndpointRelation(endpointID portainer.EndpointID) (*portainer.EndpointRelation, error) {
	var endpointRelation portainer.EndpointRelation
	identifier := service.connection.ConvertToKey(int(endpointID))

	err := service.connection.GetObject(BucketName, identifier, &endpointRelation)
	if err != nil {
		return nil, err
	}

	return &endpointRelation, nil
}

// CreateEndpointRelation saves endpointRelation
func (service *Service) Create(endpointRelation *portainer.EndpointRelation) error {
	return service.connection.CreateObjectWithId(BucketName, int(endpointRelation.EndpointID), endpointRelation)
}

// UpdateEndpointRelation updates an Environment(Endpoint) relation object
func (service *Service) UpdateEndpointRelation(EndpointID portainer.EndpointID, endpointRelation *portainer.EndpointRelation) error {
	identifier := service.connection.ConvertToKey(int(EndpointID))
	return service.connection.UpdateObject(BucketName, identifier, endpointRelation)
}

// DeleteEndpointRelation deletes an Environment(Endpoint) relation object
func (service *Service) DeleteEndpointRelation(EndpointID portainer.EndpointID) error {
	identifier := service.connection.ConvertToKey(int(EndpointID))
	return service.connection.DeleteObject(BucketName, identifier)
}
