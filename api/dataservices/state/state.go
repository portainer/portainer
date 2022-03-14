package state

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "state"
	key        = "STATE"
)

// Service represents a service for managing environment(endpoint) data.
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

// State retrieve the state object.
func (service *Service) State() (*portainer.State, error) {
	var state portainer.State

	err := service.connection.GetObject(BucketName, []byte(key), &state)
	if err != nil {
		return nil, err
	}

	return &state, nil
}

// UpdateState persists a State object.
func (service *Service) UpdateState(state *portainer.State) error {
	return service.connection.UpdateObject(BucketName, []byte(key), state)
}
