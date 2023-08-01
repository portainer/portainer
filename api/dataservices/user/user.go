package user

import (
	portainer "github.com/portainer/portainer/api"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// User returns a user by ID
func (service *Service) User(ID portainer.UserID) (*portainer.User, error) {
	var obj portainer.User

	err := service.connection.GetByID(int(ID), &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
}

// UserByUsername returns a user by username.
func (service *Service) UserByUsername(username string) (*portainer.User, error) {
	var u portainer.User

	db := service.connection.GetDB()
	tx := db.First(&u, `username = ?`, username)

	if tx.Error != nil {
		return nil, tx.Error
	}

	return &u, nil
}

// Users return an array containing all the users.
func (service *Service) Users() ([]portainer.User, error) {
	var users = make([]portainer.User, 0)

	db := service.connection.GetDB()
	tx := db.Find(&users)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return users, nil
}

// UsersByRole return an array containing all the users with the specified role.
func (service *Service) UsersByRole(role portainer.UserRole) ([]portainer.User, error) {
	var users = make([]portainer.User, 0)

	db := service.connection.GetDB()
	tx := db.Find(&users, `role = ?`, role)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return users, nil
}

// UpdateUser saves a user.
func (service *Service) UpdateUser(ID portainer.UserID, user *portainer.User) error {
	db := service.connection.GetDB()
	user.ID = ID
	tx := db.Save(&user)
	if tx.Error != nil {
		return tx.Error
	}

	return nil
}

// CreateUser creates a new user.
func (service *Service) Create(user *portainer.User) error {
	db := service.connection.GetDB()
	tx := db.Create(&user)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// DeleteUser deletes a user.
func (service *Service) DeleteUser(ID portainer.UserID) error {
	return service.connection.DeleteByID(int(ID), &portainer.User{})
}
