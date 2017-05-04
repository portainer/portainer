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

// ResourceControls returns all the ResourceControl objects
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

// CreateResourceControl creates a new ResourceControl object
func (service *ResourceControlService) CreateResourceControl(rc *portainer.ResourceControl) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(resourceControlBucketName))
		id, _ := bucket.NextSequence()
		rc.ID = portainer.ResourceControlID(id)
		data, err := internal.MarshalResourceControl(rc)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(rc.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteResourceControl deletes a ResourceControl object by ID
func (service *ResourceControlService) DeleteResourceControl(ID portainer.ResourceControlID) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(resourceControlBucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
