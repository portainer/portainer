package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/authorization"
)

func (m *Migrator) updateRbacRolesToDB29() error {
	defaultAuthorizationsOfRoles := map[portainer.RoleID]portainer.Authorizations{
		portainer.RoleIDEndpointAdmin: authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole(),
		portainer.RoleIDHelpdesk:      authorization.DefaultEndpointAuthorizationsForHelpDeskRole(),
		portainer.RoleIDOperator:      authorization.DefaultEndpointAuthorizationsForOperatorRole(),
		portainer.RoleIDStandardUser:  authorization.DefaultEndpointAuthorizationsForStandardUserRole(),
		portainer.RoleIDReadonly:      authorization.DefaultEndpointAuthorizationsForReadOnlyUserRole(),
	}

	for roleID, defaultAuthorizations := range defaultAuthorizationsOfRoles {
		role, err := m.roleService.Role(roleID)
		if err != nil {
			return err
		}
		role.Authorizations = defaultAuthorizations

		err = m.roleService.UpdateRole(role.ID, role)
		if err != nil {
			return err
		}
	}

	return m.authorizationService.UpdateUsersAuthorizations()
}
