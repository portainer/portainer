package user

import (
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
	return &Service{
		connection: connection,
	}, nil
}

// User returns a user by ID
func (service *Service) User(ID portainer.UserID) (*portainer.User, error) {
	var user portainer.User

	return &user, nil
}

// UserByUsername returns a user by username.
func (service *Service) UserByUsername(username string) (*portainer.User, error) {
	return nil, nil
}

// Users return an array containing all the users.
func (service *Service) Users() ([]portainer.User, error) {
	var users = make([]portainer.User, 0)
	return users, nil
}

// UsersByRole return an array containing all the users with the specified role.
func (service *Service) UsersByRole(role portainer.UserRole) ([]portainer.User, error) {
	var users = make([]portainer.User, 0)
	return users, nil
}

// UpdateUser saves a user.
func (service *Service) UpdateUser(ID portainer.UserID, user *portainer.User) error {
	return nil
}

// CreateUser creates a new user.
func (service *Service) Create(user *portainer.User) error {
	return nil
}

// DeleteUser deletes a user.
func (service *Service) DeleteUser(ID portainer.UserID) error {
	return nil
}
