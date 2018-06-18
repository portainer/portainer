package endpoint

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoints"
)

// Service represents a service for managing endpoint data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(BucketName))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// Endpoint returns an endpoint by ID.
func (service *Service) Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error) {
	var data []byte
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
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
	err = internal.UnmarshalObject(data, &endpoint)
	if err != nil {
		return nil, err
	}
	return &endpoint, nil
}

// Endpoints return an array containing all the endpoints.
func (service *Service) Endpoints() ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var endpoint portainer.Endpoint
			err := internal.UnmarshalObject(v, &endpoint)
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
func (service *Service) Synchronize(toCreate, toUpdate, toDelete []*portainer.Endpoint) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

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
func (service *Service) CreateEndpoint(endpoint *portainer.Endpoint) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := storeNewEndpoint(endpoint, bucket)
		if err != nil {
			return err
		}
		return nil
	})
}

// UpdateEndpoint updates an endpoint.
func (service *Service) UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error {
	data, err := internal.MarshalObject(endpoint)
	if err != nil {
		return err
	}

	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err = bucket.Put(internal.Itob(int(ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteEndpoint deletes an endpoint.
func (service *Service) DeleteEndpoint(ID portainer.EndpointID) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}

func marshalAndStoreEndpoint(endpoint *portainer.Endpoint, bucket *bolt.Bucket) error {
	data, err := internal.MarshalObject(endpoint)
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
