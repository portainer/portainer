package deploykey

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"
	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "deploykeys"
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

// Deploykeys return an array containing all the deploykeys.
func (service *Service) Deploykeys() ([]portainer.Deploykey, error) {
	var deploykeys = make([]portainer.Deploykey, 0)
	
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var deploykey portainer.Deploykey
			err := internal.UnmarshalObject(v, &deploykey)
			if err != nil {
				return err
			}
			deploykeys = append(deploykeys, deploykey)
		}

		return nil
	})

	return deploykeys, err
}

// createDeployKey creates a new deploykey.
func (service *Service) createDeploykey(deploykey *portainer.Deploykey) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		deploykey.ID = portainer.DeploykeyID(id)

		data, err := internal.MarshalObject(deploykey)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(deploykey.ID)), data)
	})
}

// deleteDeployKey deletes a deploykey.
func (service *Service) deleteDeploykey(ID portainer.DeploykeyID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}
