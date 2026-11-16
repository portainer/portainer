package logforge

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName  = "logforge"
	settingsKey = "LOGFORGE"
)

// Service represents a service for managing LogForge integration settings.
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

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: service,
		tx:      tx,
	}
}

// Settings retrieves the LogForge settings object.
func (service *Service) Settings() (*portainer.LogForgeSettings, error) {
	if err := service.connection.SetServiceName(BucketName); err != nil {
		return nil, err
	}

	var settings portainer.LogForgeSettings

	err := service.connection.GetObject(BucketName, []byte(settingsKey), &settings)
	if err != nil {
		return nil, err
	}

	return &settings, nil
}

// UpdateSettings persists a LogForge settings object.
func (service *Service) UpdateSettings(settings *portainer.LogForgeSettings) error {
	if err := service.connection.SetServiceName(BucketName); err != nil {
		return err
	}

	return service.connection.UpdateObject(BucketName, []byte(settingsKey), settings)
}

// DeleteSettings removes the LogForge settings object.
func (service *Service) DeleteSettings() error {
	if err := service.connection.SetServiceName(BucketName); err != nil {
		return err
	}

	return service.connection.DeleteObject(BucketName, []byte(settingsKey))
}
