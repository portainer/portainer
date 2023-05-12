package ssl

import (
	portainer "github.com/portainer/portainer/api"
)

// Service represents a service for managing ssl data.
type Service struct {
	connection portainer.Connection
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// Settings retrieve the ssl settings object.
func (service *Service) Settings() (*portainer.SSLSettings, error) {
	var settings portainer.SSLSettings
	db := service.connection.GetDB()
	tx := db.Take(&settings)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return &settings, nil
}

// UpdateSettings persists a SSLSettings object.
func (service *Service) UpdateSettings(settings *portainer.SSLSettings) error {
	db := service.connection.GetDB()
	settings.ID = 1
	tx := db.Save(settings)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}
