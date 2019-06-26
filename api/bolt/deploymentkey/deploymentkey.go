package deploymentkey

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "deploymentkey"
)

// Service represents a service for managing deploymentkey data.
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

// DeploymentKeys return all the deployment keys that are created.
func (service *Service) DeploymentKeys() ([]portainer.DeploymentKey, error) {
	var deploymentkeys = make([]portainer.DeploymentKey, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var deploymentkey portainer.DeploymentKey
			err := internal.UnmarshalObject(v, &deploymentkey)
			if err != nil {
				return err
			}
			deploymentkeys = append(deploymentkeys, deploymentkey)
		}

		return nil
	})

	return deploymentkeys, err
}

// DeploymentKey returns the deployment key by deployment key ID.
func (service *Service) DeploymentKey(ID portainer.DeploymentKeyID) (*portainer.DeploymentKey, error) {
	var deploymentkey portainer.DeploymentKey
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &deploymentkey)
	if err != nil {
		return nil, err
	}

	return &deploymentkey, nil
}

// DeploymentKeyByName returns a deploymentkey by name.
func (service *Service) DeploymentKeyByName(name string) (*portainer.DeploymentKey, error) {
	var deploymentkey *portainer.DeploymentKey

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var t portainer.DeploymentKey
			err := internal.UnmarshalObject(v, &t)
			if err != nil {
				return err
			}

			if t.Name == name {
				deploymentkey = &t
				break
			}
		}

		if deploymentkey == nil {
			return portainer.ErrObjectNotFound
		}

		return nil
	})

	return deploymentkey, err
}

// DeleteDeploymentKey deletes a deployment key.
func (service *Service) DeleteDeploymentKey(ID portainer.DeploymentKeyID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}

// CreateDeploymentKey creates a deployment key.
func (service *Service) CreateDeploymentKey(deploymentkey *portainer.DeploymentKey) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		deploymentkey.ID = portainer.DeploymentKeyID(id)

		data, err := internal.MarshalObject(deploymentkey)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(deploymentkey.ID)), data)
	})
}
