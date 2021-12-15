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
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Settings retrieve the settings object.
func (service *Service) Settings() (*portainer.Settings, error) {
	var settings portainer.Settings

	err := service.connection.GetObject(BucketName, []byte(settingsKey), &settings)
	if err != nil {
		return nil, err
	}

	return &settings, nil
}

// UpdateSettings persists a Settings object.
func (service *Service) UpdateSettings(settings *portainer.Settings) error {
	return service.connection.UpdateObject(BucketName, []byte(settingsKey), settings)
}

func (service *Service) IsFeatureFlagEnabled(feature portainer.Feature) bool {
	settings, err := service.Settings()
	if err != nil {
		return false
	}

	featureFlagSetting, ok := settings.FeatureFlagSettings[feature]
	if ok {
		return featureFlagSetting
	}

	return false
}
