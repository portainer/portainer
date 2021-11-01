package apikey

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "api_key"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new instance of a service.
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := internal.CreateBucket(connection, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// GetAPIKeysByUserID return an slice containing all the APIKeys a user has access to.
func (service *Service) GetAPIKeysByUserID(userID portainer.UserID) ([]portainer.APIKey, error) {
	var result = make([]portainer.APIKey, 0)

	err := service.connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var record portainer.APIKey
			err := internal.UnmarshalObject(v, &record)
			if err != nil {
				return err
			}

			if record.UserID == userID {
				result = append(result, record)
			}
		}

		return nil
	})

	return result, err
}

// CreateKey creates a new APIKey object.
func (service *Service) CreateKey(record *portainer.APIKey) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		record.ID = portainer.APIKeyID(id)

		data, err := internal.MarshalObject(record)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(record.ID)), data)
	})
}
