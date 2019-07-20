package dockerhub

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

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
	err := internal.CreateBucket(db, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// DockerHub returns the DockerHub object.
func (service *Service) DockerHub() (*portainer.DockerHub, error) {
	var dockerhub portainer.DockerHub

	err := internal.GetObject(service.db, BucketName, []byte(dockerHubKey), &dockerhub)
	if err != nil {
		return nil, err
	}

	return &dockerhub, nil
}

// UpdateDockerHub updates a DockerHub object.
func (service *Service) UpdateDockerHub(dockerhub *portainer.DockerHub) error {
	return internal.UpdateObject(service.db, BucketName, []byte(dockerHubKey), dockerhub)
}
