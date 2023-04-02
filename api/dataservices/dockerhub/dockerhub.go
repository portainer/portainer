package dockerhub

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName   = "dockerhub"
	dockerHubKey = "DOCKERHUB"
)

// Service represents a service for managing Dockerhub data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// DockerHub returns the DockerHub object.
func (service *Service) DockerHub() (*portainer.DockerHub, error) {
	var dockerhub portainer.DockerHub

	return &dockerhub, nil
}

// UpdateDockerHub updates a DockerHub object.
func (service *Service) UpdateDockerHub(dockerhub *portainer.DockerHub) error {
	return nil
}
