package settings

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName  = "settings"
	settingsKey = "SETTINGS"
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

// Settings retrieve the settings object.
func (service *Service) Settings() (*portainer.Settings, error) {
	var settings portainer.Settings

	return &settings, nil
}

// UpdateSettings persists a Settings object.
func (service *Service) UpdateSettings(settings *portainer.Settings) error {
	return nil
}

func (service *Service) IsFeatureFlagEnabled(feature portainer.Feature) bool {
	return false
}
