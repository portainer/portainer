package role

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "roles"
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

// Role returns a Role by ID
func (service *Service) Role(ID portainer.RoleID) (*portainer.Role, error) {
	var set portainer.Role
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &set)
	if err != nil {
		return nil, err
	}

	return &set, nil
}

// Roles return an array containing all the sets.
func (service *Service) Roles() ([]portainer.Role, error) {
	var sets = make([]portainer.Role, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Role{},
		func(obj interface{}) (interface{}, error) {
			set, ok := obj.(*portainer.Role)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Role object")
				return nil, fmt.Errorf("Failed to convert to Role object: %s", obj)
			}
			sets = append(sets, *set)
			return &portainer.Role{}, nil
		})

	return sets, err
}

// CreateRole creates a new Role.
func (service *Service) Create(role *portainer.Role) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			role.ID = portainer.RoleID(id)
			return int(role.ID), role
		},
	)
}

// UpdateRole updates a role.
func (service *Service) UpdateRole(ID portainer.RoleID, role *portainer.Role) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, role)
}
