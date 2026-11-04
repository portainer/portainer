package logforge

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

// Settings retrieves the LogForge settings object.
func (service ServiceTx) Settings() (*portainer.LogForgeSettings, error) {
	if err := service.tx.SetServiceName(BucketName); err != nil {
		return nil, err
	}

	var settings portainer.LogForgeSettings

	err := service.tx.GetObject(BucketName, []byte(settingsKey), &settings)
	if err != nil {
		return nil, err
	}

	return &settings, nil
}

// UpdateSettings persists a LogForge settings object.
func (service ServiceTx) UpdateSettings(settings *portainer.LogForgeSettings) error {
	if err := service.tx.SetServiceName(BucketName); err != nil {
		return err
	}

	return service.tx.UpdateObject(BucketName, []byte(settingsKey), settings)
}

// DeleteSettings removes the LogForge settings object.
func (service ServiceTx) DeleteSettings() error {
	if err := service.tx.SetServiceName(BucketName); err != nil {
		return err
	}

	return service.tx.DeleteObject(BucketName, []byte(settingsKey))
}
