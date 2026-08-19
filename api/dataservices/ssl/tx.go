package ssl

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
func (service ServiceTx) Settings() (*portainer.SSLSettings, error) {
	var settings portainer.SSLSettings

	err := service.tx.GetObject(BucketName, []byte(key), &settings)
	if err != nil {
		return nil, err
	}

	return &settings, nil
}

// UpdateSettings persists a Settings object.
func (service ServiceTx) UpdateSettings(settings *portainer.SSLSettings) error {
	return service.tx.UpdateObject(BucketName, []byte(key), settings)
}
