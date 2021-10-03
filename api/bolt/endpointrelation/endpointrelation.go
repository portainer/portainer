package endpointrelation

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoint_relations"
)

// Service represents a service for managing environment(endpoint) relation data.
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

// EndpointRelation returns a Environment(Endpoint) relation object by EndpointID
func (service *Service) EndpointRelation(endpointID portainer.EndpointID) (*portainer.EndpointRelation, error) {
	var endpointRelation portainer.EndpointRelation
	identifier := internal.Itob(int(endpointID))

	err := internal.GetObject(service.connection, BucketName, identifier, &endpointRelation)
	if err != nil {
		return nil, err
	}

	return &endpointRelation, nil
}

// CreateEndpointRelation saves endpointRelation
func (service *Service) Create(endpointRelation *portainer.EndpointRelation) error {
	return internal.CreateObjectWithId(service.connection, BucketName, int(endpointRelation.EndpointID), endpointRelation)
}

// UpdateEndpointRelation updates an Environment(Endpoint) relation object
func (service *Service) UpdateEndpointRelation(EndpointID portainer.EndpointID, endpointRelation *portainer.EndpointRelation) error {
	identifier := internal.Itob(int(EndpointID))
	return internal.UpdateObject(service.connection, BucketName, identifier, endpointRelation)
}

// DeleteEndpointRelation deletes an Environment(Endpoint) relation object
func (service *Service) DeleteEndpointRelation(EndpointID portainer.EndpointID) error {
	identifier := internal.Itob(int(EndpointID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}
