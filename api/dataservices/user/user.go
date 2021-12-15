package user

import (
	"fmt"
	"strings"

	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"

	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "users"
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

// User returns a user by ID
func (service *Service) User(ID portainer.UserID) (*portainer.User, error) {
	var user portainer.User
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// UserByUsername returns a user by username.
func (service *Service) UserByUsername(username string) (*portainer.User, error) {
	var u *portainer.User
	stop := fmt.Errorf("ok")
	err := service.connection.GetAll(
		BucketName,
		&portainer.User{},
		func(obj interface{}) (interface{}, error) {
			user, ok := obj.(*portainer.User)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to User object")
				return nil, fmt.Errorf("Failed to convert to User object: %s", obj)
			}
			if strings.EqualFold(user.Username, username) {
				u = user
				return nil, stop
			}
			return &portainer.User{}, nil
		})
	if err == stop {
		return u, nil
	}
	if err == nil {
		return nil, errors.ErrObjectNotFound
	}

	return nil, err
}

// Users return an array containing all the users.
func (service *Service) Users() ([]portainer.User, error) {
	var users = make([]portainer.User, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.User{},
		func(obj interface{}) (interface{}, error) {
			user, ok := obj.(*portainer.User)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to User object")
				return nil, fmt.Errorf("Failed to convert to User object: %s", obj)
			}
			users = append(users, *user)
			return &portainer.User{}, nil
		})

	return users, err
}

// UsersByRole return an array containing all the users with the specified role.
func (service *Service) UsersByRole(role portainer.UserRole) ([]portainer.User, error) {
	var users = make([]portainer.User, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.User{},
		func(obj interface{}) (interface{}, error) {
			user, ok := obj.(*portainer.User)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to User object")
				return nil, fmt.Errorf("Failed to convert to User object: %s", obj)
			}
			if user.Role == role {
				users = append(users, *user)
			}
			return &portainer.User{}, nil
		})

	return users, err
}

// UpdateUser saves a user.
func (service *Service) UpdateUser(ID portainer.UserID, user *portainer.User) error {
	identifier := service.connection.ConvertToKey(int(ID))
	user.Username = strings.ToLower(user.Username)
	return service.connection.UpdateObject(BucketName, identifier, user)
}

// CreateUser creates a new user.
func (service *Service) Create(user *portainer.User) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			user.ID = portainer.UserID(id)
			user.Username = strings.ToLower(user.Username)

			return int(user.ID), user
		},
	)
}

// DeleteUser deletes a user.
func (service *Service) DeleteUser(ID portainer.UserID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
