package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// ResourceControlService represents a service for managing resource controls.
type ResourceControlService struct {
	store *Store
}

// ResourceControl returns a resource control object by resource ID
func (service *ResourceControlService) ResourceControl(resourceID string) (*portainer.ResourceControl, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(resourceControlBucketName))
		value := bucket.Get([]byte(resourceID))
		if value == nil {
			return nil
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}
	if data == nil {
		return nil, nil
	}

	var rc portainer.ResourceControl
	err = internal.UnmarshalResourceControl(data, &rc)
	if err != nil {
		return nil, err
	}
	return &rc, nil
}

// ResourceControls returns all resource control objects
func (service *ResourceControlService) ResourceControls() ([]portainer.ResourceControl, error) {
	var rcs = make([]portainer.ResourceControl, 0)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(resourceControlBucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var rc portainer.ResourceControl
			err := internal.UnmarshalResourceControl(v, &rc)
			if err != nil {
				return err
			}
			rcs = append(rcs, rc)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return rcs, nil
}

// CreateResourceControl creates a new resource control
func (service *ResourceControlService) CreateResourceControl(resourceID string, rc *portainer.ResourceControl) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(resourceControlBucketName))
		data, err := internal.MarshalResourceControl(rc)
		if err != nil {
			return err
		}

		err = bucket.Put([]byte(resourceID), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteResourceControl deletes a resource control object by resource ID
func (service *ResourceControlService) DeleteResourceControl(resourceID string) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(resourceControlBucketName))
		err := bucket.Delete([]byte(resourceID))
		if err != nil {
			return err
		}
		return nil
	})
}
