package helmuserrepository

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "helm_user_repository"

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	dataservices.BaseDataService[portainer.HelmUserRepository, portainer.HelmUserRepositoryID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.HelmUserRepository, portainer.HelmUserRepositoryID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

// HelmUserRepositoryByUserID return an array containing all the HelmUserRepository objects where the specified userID is present.
func (service *Service) HelmUserRepositoryByUserID(userID portainer.UserID) ([]portainer.HelmUserRepository, error) {
	var result = make([]portainer.HelmUserRepository, 0)

	return result, service.Connection.GetAll(
		BucketName,
		&portainer.HelmUserRepository{},
		dataservices.FilterFn(&result, func(e portainer.HelmUserRepository) bool {
			return e.UserID == userID
		}),
	)
}

// CreateHelmUserRepository creates a new HelmUserRepository object.
func (service *Service) Create(record *portainer.HelmUserRepository) error {
	return service.Connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			record.ID = portainer.HelmUserRepositoryID(id)
			return int(record.ID), record
		},
	)
}
