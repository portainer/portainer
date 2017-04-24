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

func getBucketNameByResourceControlType(rcType portainer.ResourceControlType) string {
	bucketName := containerResourceControlBucketName
	if rcType == portainer.ServiceResourceControl {
		bucketName = serviceResourceControlBucketName
	} else if rcType == portainer.VolumeResourceControl {
		bucketName = volumeResourceControlBucketName
	}
	return bucketName
}

// ResourceControl returns a resource control object by resource ID
func (service *ResourceControlService) ResourceControl(resourceID string, rcType portainer.ResourceControlType) (*portainer.ResourceControl, error) {
	var data []byte
	bucketName := getBucketNameByResourceControlType(rcType)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
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
func (service *ResourceControlService) ResourceControls(rcType portainer.ResourceControlType) ([]portainer.ResourceControl, error) {
	var rcs = make([]portainer.ResourceControl, 0)
	bucketName := getBucketNameByResourceControlType(rcType)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

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
func (service *ResourceControlService) CreateResourceControl(rc *portainer.ResourceControl, rcType portainer.ResourceControlType) error {
	bucketName := getBucketNameByResourceControlType(rcType)
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
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

// DeleteResourceControl deletes a resource control object by resource ID
func (service *ResourceControlService) DeleteResourceControl(ID portainer.ResourceControlID, rcType portainer.ResourceControlType) error {
	bucketName := getBucketNameByResourceControlType(rcType)
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
