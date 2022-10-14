package tunnelserver

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "tunnel_server"
	infoKey    = "INFO"
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
	return &Service{
		connection: connection,
	}, nil
}

// Info retrieve the TunnelServerInfo object.
func (service *Service) Info() (*portainer.TunnelServerInfo, error) {
	var info portainer.TunnelServerInfo

	return &info, nil
}

// UpdateInfo persists a TunnelServerInfo object.
func (service *Service) UpdateInfo(settings *portainer.TunnelServerInfo) error {
	return nil
}
