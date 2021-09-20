package endpointgroup

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
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
	err := internal.CreateBucket(connection, BucketName)
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

	err := internal.GetObject(service.connection, BucketName, identifier, &endpointGroup)
	if err != nil {
		return nil, err
	}

	return &endpointGroup, nil
}

// UpdateEndpointGroup updates an environment(endpoint) group.
func (service *Service) UpdateEndpointGroup(ID portainer.EndpointGroupID, endpointGroup *portainer.EndpointGroup) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.connection, BucketName, identifier, endpointGroup)
}

// DeleteEndpointGroup deletes an environment(endpoint) group.
func (service *Service) DeleteEndpointGroup(ID portainer.EndpointGroupID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}

// EndpointGroups return an array containing all the environment(endpoint) groups.
func (service *Service) EndpointGroups() ([]portainer.EndpointGroup, error) {
	var endpointGroups = make([]portainer.EndpointGroup, 0)

	err := service.connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var endpointGroup portainer.EndpointGroup
			err := internal.UnmarshalObject(v, &endpointGroup)
			if err != nil {
				return err
			}
			endpointGroups = append(endpointGroups, endpointGroup)
		}

		return nil
	})

	return endpointGroups, err
}

// CreateEndpointGroup assign an ID to a new environment(endpoint) group and saves it.
func (service *Service) CreateEndpointGroup(endpointGroup *portainer.EndpointGroup) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		endpointGroup.ID = portainer.EndpointGroupID(id)

		data, err := internal.MarshalObject(endpointGroup)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(endpointGroup.ID)), data)
	})
}
