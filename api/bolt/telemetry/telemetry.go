package telemetry

import (
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName  = "telemetry"
	settingsKey = "TELEMETRY"
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

// Telemetry retrieve the Telemetry object.
func (service *Service) Telemetry() (*portainer.Telemetry, error) {
	var telemetry portainer.Telemetry

	err := internal.GetObject(service.db, BucketName, []byte(settingsKey), &telemetry)
	if err != nil {
		return nil, err
	}

	return &telemetry, nil
}

// Update persists a Telemetry object.
func (service *Service) Update(telemetry *portainer.Telemetry) error {
	return internal.UpdateObject(service.db, BucketName, []byte(settingsKey), telemetry)
}
