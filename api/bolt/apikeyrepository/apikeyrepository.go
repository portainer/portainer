package apikeyrepository

import (
	"bytes"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "api_key"
)

// Service represents a service for managing api-key data.
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

// GetAPIKeysByUserID returns a slice containing all the APIKeys a user has access to.
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

// GetAPIKeyByDigest returns the API key for the associated digest.
// Note: there is a 1-to-1 mapping of api-key and digest
func (service *Service) GetAPIKeyByDigest(digest []byte) (*portainer.APIKey, error) {
	var result portainer.APIKey

	err := service.connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var record portainer.APIKey
			err := internal.UnmarshalObject(v, &record)
			if err != nil {
				return err
			}

			if bytes.Equal(record.Digest, digest) {
				result = record
				return nil
			}
		}
		return nil
	})

	return &result, err
}

// CreateAPIKey creates a new APIKey object.
func (service *Service) CreateAPIKey(record *portainer.APIKey) error {
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

// GetAPIKey retrieves an existing APIKey object by api key ID.
func (service *Service) GetAPIKey(keyID portainer.APIKeyID) (*portainer.APIKey, error) {
	var apiKey *portainer.APIKey

	err := service.connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		item := bucket.Get(internal.Itob(int(keyID)))
		if item == nil {
			return errors.ErrObjectNotFound
		}

		err := internal.UnmarshalObject(item, &apiKey)
		if err != nil {
			return err
		}

		return nil
	})

	return apiKey, err
}

func (service *Service) UpdateAPIKey(key *portainer.APIKey) error {
	identifier := internal.Itob(int(key.ID))
	return internal.UpdateObject(service.connection, BucketName, identifier, key)
}

func (service *Service) DeleteAPIKey(ID portainer.APIKeyID) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		return bucket.Delete(internal.Itob(int(ID)))
	})
}
