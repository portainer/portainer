package tunnelserver

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "tunnel_server"
	infoKey    = "INFO"
)

// Service represents a service for managing environment(endpoint) data.
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

// Info retrieve the TunnelServerInfo object.
func (service *Service) Info() (*portainer.TunnelServerInfo, error) {
	var info portainer.TunnelServerInfo

	err := internal.GetObject(service.connection, BucketName, []byte(infoKey), &info)
	if err != nil {
		return nil, err
	}

	return &info, nil
}

// UpdateInfo persists a TunnelServerInfo object.
func (service *Service) UpdateInfo(settings *portainer.TunnelServerInfo) error {
	return internal.UpdateObject(service.connection, BucketName, []byte(infoKey), settings)
}
