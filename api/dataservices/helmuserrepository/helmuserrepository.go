package helmuserrepository

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "helm_user_repository"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
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

//HelmUserRepository returns an array of all HelmUserRepository
func (service *Service) HelmUserRepositories() ([]portainer.HelmUserRepository, error) {
	var repos = make([]portainer.HelmUserRepository, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.HelmUserRepository{},
		func(obj interface{}) (interface{}, error) {
			r, ok := obj.(*portainer.HelmUserRepository)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to HelmUserRepository object")
				return nil, fmt.Errorf("Failed to convert to HelmUserRepository object: %s", obj)
			}
			repos = append(repos, *r)
			return &portainer.HelmUserRepository{}, nil
		})

	return repos, err
}

// HelmUserRepositoryByUserID return an array containing all the HelmUserRepository objects where the specified userID is present.
func (service *Service) HelmUserRepositoryByUserID(userID portainer.UserID) ([]portainer.HelmUserRepository, error) {
	var result = make([]portainer.HelmUserRepository, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.HelmUserRepository{},
		func(obj interface{}) (interface{}, error) {
			record, ok := obj.(*portainer.HelmUserRepository)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to HelmUserRepository object")
				return nil, fmt.Errorf("Failed to convert to HelmUserRepository object: %s", obj)
			}
			if record.UserID == userID {
				result = append(result, *record)
			}
			return &portainer.HelmUserRepository{}, nil
		})

	return result, err
}

// CreateHelmUserRepository creates a new HelmUserRepository object.
func (service *Service) Create(record *portainer.HelmUserRepository) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			record.ID = portainer.HelmUserRepositoryID(id)
			return int(record.ID), record
		},
	)
}

// UpdateHelmUserRepostory updates an registry.
func (service *Service) UpdateHelmUserRepository(ID portainer.HelmUserRepositoryID, registry *portainer.HelmUserRepository) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, registry)
}

// DeleteHelmUserRepository deletes an registry.
func (service *Service) DeleteHelmUserRepository(ID portainer.HelmUserRepositoryID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
