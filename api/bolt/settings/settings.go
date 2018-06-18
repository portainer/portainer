package settings

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName  = "settings"
	settingsKey = "SETTINGS"
)

// Service represents a service for managing endpoint data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(BucketName))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// Settings retrieve the settings object.
func (service *Service) Settings() (*portainer.Settings, error) {
	var data []byte
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		value := bucket.Get([]byte(settingsKey))
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
func (service *Service) StoreSettings(settings *portainer.Settings) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		data, err := internal.MarshalObject(settings)
		if err != nil {
			return err
		}

		err = bucket.Put([]byte(settingsKey), data)
		if err != nil {
			return err
		}
		return nil
	})
}
