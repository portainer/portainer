package user

import (
	"fmt"
	"github.com/sirupsen/logrus"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "users"
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

// User returns a user by ID
func (service *Service) User(ID portainer.UserID) (*portainer.User, error) {
	var user portainer.User
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// UserByUsername returns a user by username.
func (service *Service) UserByUsername(username string) (*portainer.User, error) {
	var u *portainer.User
	stop := fmt.Errorf("ok")
	err := internal.GetAll(
		service.connection,
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

	err := internal.GetAll(
		service.connection,
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

	err := internal.GetAll(
		service.connection,
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
	identifier := internal.Itob(int(ID))
	user.Username = strings.ToLower(user.Username)
	return internal.UpdateObject(service.connection, BucketName, identifier, user)
}

// CreateUser creates a new user.
func (service *Service) Create(user *portainer.User) error {
	return internal.CreateObject(
		service.connection,
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
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}
