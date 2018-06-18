package resourcecontrol

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "resource_control"
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

// ResourceControl returns a ResourceControl object by ID
func (service *Service) ResourceControl(ID portainer.ResourceControlID) (*portainer.ResourceControl, error) {
	var data []byte
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		value := bucket.Get(internal.Itob(int(ID)))
		if value == nil {
			return portainer.ErrResourceControlNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var resourceControl portainer.ResourceControl
	err = internal.UnmarshalObject(data, &resourceControl)
	if err != nil {
		return nil, err
	}
	return &resourceControl, nil
}

// ResourceControlByResourceID returns a ResourceControl object by checking if the resourceID is equal
// to the main ResourceID or in SubResourceIDs
func (service *Service) ResourceControlByResourceID(resourceID string) (*portainer.ResourceControl, error) {
	var resourceControl *portainer.ResourceControl

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var rc portainer.ResourceControl
			err := internal.UnmarshalObject(v, &rc)
			if err != nil {
				return err
			}
			if rc.ResourceID == resourceID {
				resourceControl = &rc
			}
			for _, subResourceID := range rc.SubResourceIDs {
				if subResourceID == resourceID {
					resourceControl = &rc
				}
			}
		}

		if resourceControl == nil {
			return portainer.ErrResourceControlNotFound
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return resourceControl, nil
}

// ResourceControls returns all the ResourceControl objects
func (service *Service) ResourceControls() ([]portainer.ResourceControl, error) {
	var rcs = make([]portainer.ResourceControl, 0)
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var resourceControl portainer.ResourceControl
			err := internal.UnmarshalObject(v, &resourceControl)
			if err != nil {
				return err
			}
			rcs = append(rcs, resourceControl)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return rcs, nil
}

// CreateResourceControl creates a new ResourceControl object
func (service *Service) CreateResourceControl(resourceControl *portainer.ResourceControl) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		id, _ := bucket.NextSequence()
		resourceControl.ID = portainer.ResourceControlID(id)
		data, err := internal.MarshalObject(resourceControl)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(resourceControl.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// UpdateResourceControl saves a ResourceControl object.
func (service *Service) UpdateResourceControl(ID portainer.ResourceControlID, resourceControl *portainer.ResourceControl) error {
	data, err := internal.MarshalObject(resourceControl)
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

// DeleteResourceControl deletes a ResourceControl object by ID
func (service *Service) DeleteResourceControl(ID portainer.ResourceControlID) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
