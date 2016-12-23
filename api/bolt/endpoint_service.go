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

const (
	activeEndpointID = 0
)

// Endpoint returns an endpoint by ID.
func (service *EndpointService) Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))
		value := bucket.Get(internal.Itob(int(ID)))
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

// Endpoints return an array containing all the endpoints.
func (service *EndpointService) Endpoints() ([]portainer.Endpoint, error) {
	var endpoints []portainer.Endpoint
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var endpoint portainer.Endpoint
			err := internal.UnmarshalEndpoint(v, &endpoint)
			if err != nil {
				return err
			}
			endpoints = append(endpoints, endpoint)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return endpoints, nil
}

// CreateEndpoint assign an ID to a new endpoint and saves it.
func (service *EndpointService) CreateEndpoint(endpoint *portainer.Endpoint) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))

		id, _ := bucket.NextSequence()
		endpoint.ID = portainer.EndpointID(id)

		data, err := internal.MarshalEndpoint(endpoint)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(endpoint.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// UpdateEndpoint updates an endpoint.
func (service *EndpointService) UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error {
	data, err := internal.MarshalEndpoint(endpoint)
	if err != nil {
		return err
	}

	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))
		err = bucket.Put(internal.Itob(int(ID)), data)
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
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}

// GetActive returns the active endpoint.
func (service *EndpointService) GetActive() (*portainer.Endpoint, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(activeEndpointBucketName))
		value := bucket.Get(internal.Itob(activeEndpointID))
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

// SetActive saves an endpoint as active.
func (service *EndpointService) SetActive(endpoint *portainer.Endpoint) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(activeEndpointBucketName))

		data, err := internal.MarshalEndpoint(endpoint)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(activeEndpointID), data)
		if err != nil {
			return err
		}
		return nil
	})
}
