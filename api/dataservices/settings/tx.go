package settings

import (
	portainer "github.com/portainer/portainer/api"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// Settings retrieve the settings object.
func (service ServiceTx) Settings() (*portainer.Settings, error) {
	var settings portainer.Settings

	err := service.tx.GetObject(BucketName, []byte(settingsKey), &settings)
	if err != nil {
		return nil, err
	}

	return &settings, nil
}

// UpdateSettings persists a Settings object.
func (service ServiceTx) UpdateSettings(settings *portainer.Settings) error {
	return service.tx.UpdateObject(BucketName, []byte(settingsKey), settings)
}
