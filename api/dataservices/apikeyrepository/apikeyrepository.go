package apikeyrepository

import (
	"errors"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"

	"github.com/rs/zerolog/log"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "api_key"

// Service represents a service for managing api-key data.
type Service struct {
	dataservices.BaseDataService[portainer.APIKey, portainer.APIKeyID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	if err := connection.SetServiceName(BucketName); err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.APIKey, portainer.APIKeyID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

// GetAPIKeysByUserID returns a slice containing all the APIKeys a user has access to.
func (service *Service) GetAPIKeysByUserID(userID portainer.UserID) ([]portainer.APIKey, error) {
	result := make([]portainer.APIKey, 0)

	err := service.Connection.GetAll(
		BucketName,
		&portainer.APIKey{},
		func(obj any) (any, error) {
			record, ok := obj.(*portainer.APIKey)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to APIKey object")
				return nil, fmt.Errorf("failed to convert to APIKey object: %s", obj)
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
func (service *Service) GetAPIKeyByDigest(digest string) (*portainer.APIKey, error) {
	var k *portainer.APIKey
	stop := errors.New("ok")
	err := service.Connection.GetAll(
		BucketName,
		&portainer.APIKey{},
		func(obj any) (any, error) {
			key, ok := obj.(*portainer.APIKey)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to APIKey object")
				return nil, fmt.Errorf("failed to convert to APIKey object: %s", obj)
			}
			if key.Digest == digest {
				k = key
				return nil, stop
			}

			return &portainer.APIKey{}, nil
		})

	if errors.Is(err, stop) {
		return k, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err
}

// Create creates a new APIKey object.
func (service *Service) Create(record *portainer.APIKey) error {
	return service.Connection.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			record.ID = portainer.APIKeyID(id)

			return int(record.ID), record
		},
	)
}
