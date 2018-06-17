package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// RegistryService represents a service for managing registries.
type RegistryService struct {
	store *Store
}

// Registry returns an registry by ID.
func (service *RegistryService) Registry(ID portainer.RegistryID) (*portainer.Registry, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(registryBucketName))
		value := bucket.Get(internal.Itob(int(ID)))
		if value == nil {
			return portainer.ErrRegistryNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var registry portainer.Registry
	err = internal.UnmarshalObject(data, &registry)
	if err != nil {
		return nil, err
	}
	return &registry, nil
}

// Registries returns an array containing all the registries.
func (service *RegistryService) Registries() ([]portainer.Registry, error) {
	var registries = make([]portainer.Registry, 0)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(registryBucketName))

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
	if err != nil {
		return nil, err
	}

	return registries, nil
}

// CreateRegistry creates a new registry.
func (service *RegistryService) CreateRegistry(registry *portainer.Registry) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(registryBucketName))

		id, _ := bucket.NextSequence()
		registry.ID = portainer.RegistryID(id)

		data, err := internal.MarshalObject(registry)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(registry.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// UpdateRegistry updates an registry.
func (service *RegistryService) UpdateRegistry(ID portainer.RegistryID, registry *portainer.Registry) error {
	data, err := internal.MarshalObject(registry)
	if err != nil {
		return err
	}

	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(registryBucketName))
		err = bucket.Put(internal.Itob(int(ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteRegistry deletes an registry.
func (service *RegistryService) DeleteRegistry(ID portainer.RegistryID) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(registryBucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
