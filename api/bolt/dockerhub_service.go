package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// DockerHubService represents a service for managing registries.
type DockerHubService struct {
	store *Store
}

const (
	dbDockerHubKey = "DOCKERHUB"
)

// DockerHub returns the DockerHub object.
func (service *DockerHubService) DockerHub() (*portainer.DockerHub, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(dockerhubBucketName))
		value := bucket.Get([]byte(dbDockerHubKey))
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
	err = internal.UnmarshalDockerHub(data, &dockerhub)
	if err != nil {
		return nil, err
	}
	return &dockerhub, nil
}

// StoreSettings persists a Settings object.
func (service *DockerHubService) StoreDockerHub(dockerhub *portainer.DockerHub) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(dockerhubBucketName))

		data, err := internal.MarshalDockerHub(dockerhub)
		if err != nil {
			return err
		}

		err = bucket.Put([]byte(dbDockerHubKey), data)
		if err != nil {
			return err
		}
		return nil
	})
}
