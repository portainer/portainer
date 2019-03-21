package registry

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "registries"
)

// Service represents a service for managing endpoint data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := internal.CreateBucket(db, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// Registry returns an registry by ID.
func (service *Service) Registry(ID portainer.RegistryID) (*portainer.Registry, error) {
	var registry portainer.Registry
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &registry)
	if err != nil {
		return nil, err
	}

	return &registry, nil
}

// Registries returns an array containing all the registries.
func (service *Service) Registries() ([]portainer.Registry, error) {
	var registries = make([]portainer.Registry, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var registry portainer.Registry
			err := internal.UnmarshalObject(v, &registry)
			if err != nil {
				return err
			}
			registries = append(registries, registry)
		}

		return nil
	})

	return registries, err
}

// CreateRegistry creates a new registry.
func (service *Service) CreateRegistry(registry *portainer.Registry) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		registry.ID = portainer.RegistryID(id)

		data, err := internal.MarshalObject(registry)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(registry.ID)), data)
	})
}

// UpdateRegistry updates an registry.
func (service *Service) UpdateRegistry(ID portainer.RegistryID, registry *portainer.Registry) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.db, BucketName, identifier, registry)
}

// DeleteRegistry deletes an registry.
func (service *Service) DeleteRegistry(ID portainer.RegistryID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}
