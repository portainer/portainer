package bolt

import (
	"strconv"

	"github.com/portainer/portainer"

	"github.com/boltdb/bolt"
)

// EndpointService represents a service for managing users.
type VersionService struct {
	store *Store
}

const (
	DBVersionKey = "DB_VERSION"
)

// DBVersion the stored database version.
func (service *VersionService) DBVersion() (int, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(versionBucketName))
		value := bucket.Get([]byte(DBVersionKey))
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
		err := bucket.Put([]byte(DBVersionKey), data)
		if err != nil {
			return err
		}
		return nil
	})
}
