package apikeyrepository

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
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
		dataservices.FilterFn(&result, func(record portainer.APIKey) bool {
			return record.UserID == userID
		}),
	)

	return result, err
}

// GetAPIKeyByDigest returns the API key for the associated digest.
// Note: there is a 1-to-1 mapping of api-key and digest
func (service *Service) GetAPIKeyByDigest(digest string) (*portainer.APIKey, error) {
	var found portainer.APIKey

	err := service.Connection.GetAll(
		BucketName,
		&portainer.APIKey{},
		dataservices.FirstFn(&found, func(key portainer.APIKey) bool {
			return key.Digest == digest
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &found, nil
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
