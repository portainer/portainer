package role

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

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: service,
		tx:      tx,
	}
}

// Role returns a Role by ID
func (service *Service) Role(ID portainer.RoleID) (*portainer.Role, error) {
	var set portainer.Role
	db := service.connection.GetDB()

	tx := db.First(&set, `id = ?`, ID)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return &set, nil
}

// Roles returns an array containing all the sets.
func (service *Service) Roles() ([]portainer.Role, error) {
	var sets = make([]portainer.Role, 0)

	db := service.connection.GetDB()
	tx := db.Find(&sets)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return sets, nil
}

// CreateRole creates a new Role.
func (service *Service) Create(role *portainer.Role) error {
	db := service.connection.GetDB()
	tx := db.Create(&role)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// UpdateRole updates a role.
func (service *Service) UpdateRole(ID portainer.RoleID, role *portainer.Role) error {
	db := service.connection.GetDB()
	role.ID = ID
	tx := db.Save(&role)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}
