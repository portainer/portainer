package user

import (
	"errors"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "users"

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	dataservices.BaseDataService[portainer.User, portainer.UserID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.User, portainer.UserID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.User, portainer.UserID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

// UserByUsername returns a user by username.
func (service *Service) UserByUsername(username string) (*portainer.User, error) {
	var u portainer.User

	err := service.Connection.GetAll(
		BucketName,
		&portainer.User{},
		dataservices.FirstFn(&u, func(e portainer.User) bool {
			return strings.EqualFold(e.Username, username)
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &u, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err
}

// UsersByRole return an array containing all the users with the specified role.
func (service *Service) UsersByRole(role portainer.UserRole) ([]portainer.User, error) {
	var users = make([]portainer.User, 0)

	return users, service.Connection.GetAll(
		BucketName,
		&portainer.User{},
		dataservices.FilterFn(&users, func(e portainer.User) bool {
			return e.Role == role
		}),
	)
}

// CreateUser creates a new user.
func (service *Service) Create(user *portainer.User) error {
	return service.Connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			user.ID = portainer.UserID(id)
			user.Username = strings.ToLower(user.Username)

			return int(user.ID), user
		},
	)
}
