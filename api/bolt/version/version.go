package version

import (
	"strconv"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "version"
	versionKey = "DB_VERSION"
)

// Service represents a service to manage stored versions.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := internal.CreateBucket(db, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// DBVersion retrieves the stored database version.
func (service *Service) DBVersion() (int, error) {
	var data []byte

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		value := bucket.Get([]byte(versionKey))
		if value == nil {
			return portainer.ErrObjectNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)

		return nil
	})
	if err != nil {
		return 0, err
	}

	return strconv.Atoi(string(data))
}

// StoreDBVersion store the database version.
func (service *Service) StoreDBVersion(version int) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		data := []byte(strconv.Itoa(version))
		return bucket.Put([]byte(versionKey), data)
	})
}
