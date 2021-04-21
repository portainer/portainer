package dockerhub

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName   = "dockerhub"
	dockerHubKey = "DOCKERHUB"
)

// Service represents a service for managing Dockerhub data.
type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new instance of a service.
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := internal.CreateBucket(connection, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// DockerHub returns the DockerHub object.
func (service *Service) DockerHub() (*portainer.DockerHub, error) {
	var dockerhub portainer.DockerHub

	err := internal.GetObject(service.connection, BucketName, []byte(dockerHubKey), &dockerhub)
	if err != nil {
		return nil, err
	}

	return &dockerhub, nil
}

// UpdateDockerHub updates a DockerHub object.
func (service *Service) UpdateDockerHub(dockerhub *portainer.DockerHub) error {
	return internal.UpdateObject(service.connection, BucketName, []byte(dockerHubKey), dockerhub)
}
