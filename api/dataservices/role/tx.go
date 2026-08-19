package role

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.Role, portainer.RoleID]
}

// CreateRole creates a new Role.
func (service ServiceTx) Create(role *portainer.Role) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			role.ID = portainer.RoleID(id)
			return int(role.ID), role
		},
	)
}
