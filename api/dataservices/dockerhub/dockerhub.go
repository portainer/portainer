package dockerhub

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName   = "dockerhub"
	dockerHubKey = "DOCKERHUB"
)

// TODO: does this get used anymore?

// Service represents a service for managing Dockerhub data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// DockerHub returns the DockerHub object.
func (service *Service) DockerHub() (*DockerHub, error) {
	var dockerhub DockerHub

	err := service.connection.GetObject(BucketName, []byte(dockerHubKey), &dockerhub)
	if err != nil {
		return nil, err
	}

	return &dockerhub, nil
}

// UpdateDockerHub updates a DockerHub object.
func (service *Service) UpdateDockerHub(dockerhub *DockerHub) error {
	return service.connection.UpdateObject(BucketName, []byte(dockerHubKey), dockerhub)
}

// DockerHub represents all the required information to connect and use the Docker Hub
type DockerHub struct {
	// Is authentication against DockerHub enabled
	Authentication bool `json:"Authentication" example:"true"`
	// Username used to authenticate against the DockerHub
	Username string `json:"Username" example:"user"`
	// Password used to authenticate against the DockerHub
	Password string `json:"Password,omitempty" example:"passwd"`
}
