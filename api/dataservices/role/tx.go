package role

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

// Service represents a service for managing environment(endpoint) data.
type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// Role returns a Role by ID
func (service ServiceTx) Role(ID portainer.RoleID) (*portainer.Role, error) {
	var set portainer.Role
	identifier := service.service.connection.ConvertToKey(int(ID))

	err := service.tx.GetObject(BucketName, identifier, &set)
	if err != nil {
		return nil, err
	}

	return &set, nil
}

// Roles returns an array containing all the sets.
func (service ServiceTx) Roles() ([]portainer.Role, error) {
	var sets = make([]portainer.Role, 0)

	err := service.tx.GetAll(
		BucketName,
		&portainer.Role{},
		func(obj interface{}) (interface{}, error) {
			set, ok := obj.(*portainer.Role)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to Role object")
				return nil, fmt.Errorf("failed to convert to Role object: %s", obj)
			}

			sets = append(sets, *set)

			return &portainer.Role{}, nil
		})

	return sets, err
}

// CreateRole creates a new Role.
func (service ServiceTx) Create(role *portainer.Role) error {
	return service.tx.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			role.ID = portainer.RoleID(id)
			return int(role.ID), role
		},
	)
}

// UpdateRole updates a role.
func (service ServiceTx) UpdateRole(ID portainer.RoleID, role *portainer.Role) error {
	identifier := service.service.connection.ConvertToKey(int(ID))
	return service.tx.UpdateObject(BucketName, identifier, role)
}
