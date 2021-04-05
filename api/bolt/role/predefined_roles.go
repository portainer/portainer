package role

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/internal/authorization"
)

// CreateOrUpdatePredefinedRoles update the predefined roles. Create one if it does not exist yet.
func (service *Service) CreateOrUpdatePredefinedRoles() error {
	predefinedRoles := map[portainer.RoleID]*portainer.Role{
		portainer.RoleIDEndpointAdmin: &portainer.Role{
			Name:           "Endpoint administrator",
			Description:    "Full control of all resources in an endpoint",
			ID:             portainer.RoleIDEndpointAdmin,
			Priority:       1,
			Authorizations: authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole(),
		},
		portainer.RoleIDOperator: &portainer.Role{
			Name:           "Operator",
			Description:    "Operational control of all existing resources in an endpoint",
			ID:             portainer.RoleIDOperator,
			Priority:       2,
			Authorizations: authorization.DefaultEndpointAuthorizationsForOperatorRole(),
		},
		portainer.RoleIDHelpdesk: &portainer.Role{
			Name:           "Helpdesk",
			Description:    "Read-only access of all resources in an endpoint",
			ID:             portainer.RoleIDHelpdesk,
			Priority:       3,
			Authorizations: authorization.DefaultEndpointAuthorizationsForHelpDeskRole(),
		},
		portainer.RoleIDStandardUser: &portainer.Role{
			Name:           "Standard user",
			Description:    "Full control of assigned resources in an endpoint",
			ID:             portainer.RoleIDStandardUser,
			Priority:       4,
			Authorizations: authorization.DefaultEndpointAuthorizationsForStandardUserRole(),
		},
		portainer.RoleIDReadonly: &portainer.Role{
			Name:           "Read-only user",
			Description:    "Read-only access of assigned resources in an endpoint",
			ID:             portainer.RoleIDReadonly,
			Priority:       5,
			Authorizations: authorization.DefaultEndpointAuthorizationsForReadOnlyUserRole(),
		},
	}

	for roleID, predefinedRole := range predefinedRoles {
		_, err := service.Role(roleID)

		if err == errors.ErrObjectNotFound {
			err := service.CreateRole(predefinedRole)
			if err != nil {
				return err
			}
		} else if err != nil {
			return err
		} else {
			err = service.UpdateRole(predefinedRole.ID, predefinedRole)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
