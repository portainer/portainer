package apikeyrepository

import (
	"bytes"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "api_key"
)

// Service represents a service for managing api-key data.
type Service struct {
	connection portainer.Connection
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
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

	err := service.connection.GetAll(
		BucketName,
		&portainer.APIKey{},
		func(obj interface{}) (interface{}, error) {
			record, ok := obj.(*portainer.APIKey)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to APIKey object")
				return nil, fmt.Errorf("Failed to convert to APIKey object: %s", obj)
			}
			if record.UserID == userID {
				result = append(result, *record)
			}
			return &portainer.APIKey{}, nil
		})

	return result, err
}

// GetAPIKeyByDigest returns the API key for the associated digest.
// Note: there is a 1-to-1 mapping of api-key and digest
func (service *Service) GetAPIKeyByDigest(digest []byte) (*portainer.APIKey, error) {
	var k *portainer.APIKey
	stop := fmt.Errorf("ok")
	err := service.connection.GetAll(
		BucketName,
		&portainer.APIKey{},
		func(obj interface{}) (interface{}, error) {
			key, ok := obj.(*portainer.APIKey)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to APIKey object")
				return nil, fmt.Errorf("Failed to convert to APIKey object: %s", obj)
			}
			if bytes.Equal(key.Digest, digest) {
				k = key
				return nil, stop
			}
			return &portainer.APIKey{}, nil
		})
	if err == stop {
		return k, nil
	}
	if err == nil {
		return nil, errors.ErrObjectNotFound
	}

	return nil, err
}

// CreateAPIKey creates a new APIKey object.
func (service *Service) CreateAPIKey(record *portainer.APIKey) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			record.ID = portainer.APIKeyID(id)

			return int(record.ID), record
		},
	)
}

// GetAPIKey retrieves an existing APIKey object by api key ID.
func (service *Service) GetAPIKey(keyID portainer.APIKeyID) (*portainer.APIKey, error) {
	var key portainer.APIKey
	identifier := service.connection.ConvertToKey(int(keyID))

	err := service.connection.GetObject(BucketName, identifier, &key)
	if err != nil {
		return nil, err
	}

	return &key, nil
}

func (service *Service) UpdateAPIKey(key *portainer.APIKey) error {
	identifier := service.connection.ConvertToKey(int(key.ID))
	return service.connection.UpdateObject(BucketName, identifier, key)
}

func (service *Service) DeleteAPIKey(ID portainer.APIKeyID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
