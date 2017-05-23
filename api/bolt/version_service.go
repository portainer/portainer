package bolt

import (
	"strconv"

	"github.com/portainer/portainer"

	"github.com/boltdb/bolt"
)

// VersionService represents a service to manage stored versions.
type VersionService struct {
	store *Store
}

const (
	dBVersionKey = "DB_VERSION"
)

// DBVersion retrieves the stored database version.
func (service *VersionService) DBVersion() (int, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(versionBucketName))
		value := bucket.Get([]byte(dBVersionKey))
		if value == nil {
			return portainer.ErrDBVersionNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return 0, err
	}

	dbVersion, err := strconv.Atoi(string(data))
	if err != nil {
		return 0, err
	}

	return dbVersion, nil
}

// StoreDBVersion store the database version.
func (service *VersionService) StoreDBVersion(version int) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(versionBucketName))

		data := []byte(strconv.Itoa(version))
		err := bucket.Put([]byte(dBVersionKey), data)
		if err != nil {
			return err
		}
		return nil
	})
}
