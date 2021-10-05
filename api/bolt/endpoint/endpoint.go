package endpoint

import (
	"fmt"
	"github.com/boltdb/bolt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoints"
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

// Endpoint returns an environment(endpoint) by ID.
func (service *Service) Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error) {
	var endpoint portainer.Endpoint
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &endpoint)
	if err != nil {
		return nil, err
	}

	return &endpoint, nil
}

// UpdateEndpoint updates an environment(endpoint).
func (service *Service) UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.connection, BucketName, identifier, endpoint)
}

// DeleteEndpoint deletes an environment(endpoint).
func (service *Service) DeleteEndpoint(ID portainer.EndpointID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}

// Endpoints return an array containing all the environments(endpoints).
func (service *Service) Endpoints() ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)

	err := internal.GetAllWithJsoniter(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			endpoint, ok := obj.(portainer.Endpoint)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Endpoint object")
				return fmt.Errorf("Failed to convert to Endpoint object: %s", obj)
			}
			endpoints = append(endpoints, endpoint)
			return nil
		})

	return endpoints, err
}

// CreateEndpoint assign an ID to a new environment(endpoint) and saves it.
func (service *Service) Create(endpoint *portainer.Endpoint) error {
	return internal.CreateObjectWithSetSequence(service.connection, BucketName, int(endpoint.ID), endpoint)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) GetNextIdentifier() int {
	return internal.GetNextIdentifier(service.connection, BucketName)
}

// Synchronize creates, updates and deletes environments(endpoints) inside a single transaction.
func (service *Service) Synchronize(toCreate, toUpdate, toDelete []*portainer.Endpoint) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		for _, endpoint := range toCreate {
			id, _ := bucket.NextSequence()
			endpoint.ID = portainer.EndpointID(id)

			data, err := internal.MarshalObject(endpoint)
			if err != nil {
				return err
			}

			err = bucket.Put(internal.Itob(int(endpoint.ID)), data)
			if err != nil {
				return err
			}
		}

		for _, endpoint := range toUpdate {
			data, err := internal.MarshalObject(endpoint)
			if err != nil {
				return err
			}

			err = bucket.Put(internal.Itob(int(endpoint.ID)), data)
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
