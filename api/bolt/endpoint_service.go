package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// EndpointService represents a service for managing users.
type EndpointService struct {
	store *Store
}

// Endpoint returns an endpoint by ID.
func (service *EndpointService) Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))
		value := bucket.Get([]byte(internal.Itob(int(ID))))
		if value == nil {
			return portainer.ErrEndpointNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var endpoint portainer.Endpoint
	err = internal.UnmarshalEndpoint(data, &endpoint)
	if err != nil {
		return nil, err
	}
	return &endpoint, nil
}

// UpdateEndpoint saves an endpoint.
func (service *EndpointService) UpdateEndpoint(endpoint *portainer.Endpoint) error {
	data, err := internal.MarshalEndpoint(endpoint)
	if err != nil {
		return err
	}

	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))
		err = bucket.Put([]byte(internal.Itob(int(endpoint.ID))), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteEndpoint deletes an endpoint.
func (service *EndpointService) DeleteEndpoint(ID portainer.EndpointID) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))
		err := bucket.Delete([]byte(internal.Itob(int(ID))))
		if err != nil {
			return err
		}
		return nil
	})
}
