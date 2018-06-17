package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// SettingsService represents a service to manage application settings.
type SettingsService struct {
	store *Store
}

const (
	dbSettingsKey = "SETTINGS"
)

// Settings retrieve the settings object.
func (service *SettingsService) Settings() (*portainer.Settings, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(settingsBucketName))
		value := bucket.Get([]byte(dbSettingsKey))
		if value == nil {
			return portainer.ErrSettingsNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var settings portainer.Settings
	err = internal.UnmarshalObject(data, &settings)
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

// StoreSettings persists a Settings object.
func (service *SettingsService) StoreSettings(settings *portainer.Settings) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(settingsBucketName))

		data, err := internal.MarshalObject(settings)
		if err != nil {
			return err
		}

		err = bucket.Put([]byte(dbSettingsKey), data)
		if err != nil {
			return err
		}
		return nil
	})
}
