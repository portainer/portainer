package dockerhub

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName   = "dockerhub"
	dockerHubKey = "DOCKERHUB"
)

// Service represents a service for managing Dockerhub data.
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

// DockerHub returns the DockerHub object.
func (service *Service) DockerHub() (*portainer.DockerHub, error) {
	var data []byte
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		value := bucket.Get([]byte(dockerHubKey))
		if value == nil {
			return portainer.ErrDockerHubNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var dockerhub portainer.DockerHub
	err = internal.UnmarshalObject(data, &dockerhub)
	if err != nil {
		return nil, err
	}
	return &dockerhub, nil
}

// StoreDockerHub persists a DockerHub object.
func (service *Service) StoreDockerHub(dockerhub *portainer.DockerHub) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		data, err := internal.MarshalObject(dockerhub)
		if err != nil {
			return err
		}

		err = bucket.Put([]byte(dockerHubKey), data)
		if err != nil {
			return err
		}
		return nil
	})
}
