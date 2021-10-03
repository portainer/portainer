package helmuserrepository

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "helm_user_repository"
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

// HelmUserRepositoryByUserID return an array containing all the HelmUserRepository objects where the specified userID is present.
func (service *Service) HelmUserRepositoryByUserID(userID portainer.UserID) ([]portainer.HelmUserRepository, error) {
	var result = make([]portainer.HelmUserRepository, 0)

	err := internal.GetAll(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			record, ok := obj.(portainer.HelmUserRepository)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to HelmUserRepository object")
				return fmt.Errorf("Failed to convert to HelmUserRepository object: %s", obj)
			}
			if record.UserID == userID {
				result = append(result, record)
			}
			return nil
		})

	return result, err
}

// CreateHelmUserRepository creates a new HelmUserRepository object.
func (service *Service) Create(record *portainer.HelmUserRepository) error {
	return internal.CreateObject(
		service.connection,
		BucketName,
		func(id uint64) (int, interface{}) {
			record.ID = portainer.HelmUserRepositoryID(id)
			return int(record.ID), record
		},
	)
}
