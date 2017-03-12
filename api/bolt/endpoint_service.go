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
	var endpoints = make([]portainer.Endpoint, 0)
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

// Synchronize creates, updates and deletes endpoints inside a single transaction.
func (service *EndpointService) Synchronize(toCreate, toUpdate, toDelete []*portainer.Endpoint) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))

		for _, endpoint := range toCreate {
			err := storeNewEndpoint(endpoint, bucket)
			if err != nil {
				return err
			}
		}

		for _, endpoint := range toUpdate {
			err := marshalAndStoreEndpoint(endpoint, bucket)
			if err != nil {
				return err
			}
		}

		for _, endpoint := range toDelete {
			err := bucket.Delete(internal.Itob(int(endpoint.ID)))
			if err != nil {
				return err
			}
		}

		return nil
	})
}

// CreateEndpoint assign an ID to a new endpoint and saves it.
func (service *EndpointService) CreateEndpoint(endpoint *portainer.Endpoint) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(endpointBucketName))
		err := storeNewEndpoint(endpoint, bucket)
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

func marshalAndStoreEndpoint(endpoint *portainer.Endpoint, bucket *bolt.Bucket) error {
	data, err := internal.MarshalEndpoint(endpoint)
	if err != nil {
		return err
	}

	err = bucket.Put(internal.Itob(int(endpoint.ID)), data)
	if err != nil {
		return err
	}
	return nil
}

func storeNewEndpoint(endpoint *portainer.Endpoint, bucket *bolt.Bucket) error {
	id, _ := bucket.NextSequence()
	endpoint.ID = portainer.EndpointID(id)
	return marshalAndStoreEndpoint(endpoint, bucket)
}
