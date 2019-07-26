package tunnelserver

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "tunnel_server"
	infoKey    = "INFO"
)

// Service represents a service for managing endpoint data.
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

// Info retrieve the TunnelServerInfo object.
func (service *Service) Info() (*portainer.TunnelServerInfo, error) {
	var info portainer.TunnelServerInfo

	err := internal.GetObject(service.db, BucketName, []byte(infoKey), &info)
	if err != nil {
		return nil, err
	}

	return &info, nil
}

// UpdateInfo persists a TunnelServerInfo object.
func (service *Service) UpdateInfo(settings *portainer.TunnelServerInfo) error {
	return internal.UpdateObject(service.db, BucketName, []byte(infoKey), settings)
}
