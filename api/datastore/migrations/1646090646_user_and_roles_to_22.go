package migrations

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
	"github.com/portainer/portainer/api/internal/authorization"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   20,
		Timestamp: 1646090646,
		Up:        v20_up_user_and_roles_to_22,
		Down:      v20_down_user_and_roles_to_22,
		Name:      "user and roles to 22",
	})
}

func v20_up_user_and_roles_to_22() error {
	legacyUsers, err := migrator.store.UserService.Users()
	if err != nil {
		return err
	}

	settings, err := migrator.store.SettingsService.Settings()
	if err != nil {
		return err
	}

	for _, user := range legacyUsers {
		user.PortainerAuthorizations = authorization.DefaultPortainerAuthorizations()
		err = migrator.store.UserService.UpdateUser(user.ID, &user)
		if err != nil {
			return err
		}
	}

	endpointAdministratorRole, err := migrator.store.RoleService.Role(portainer.RoleID(1))
	if err != nil {
		return err
	}
	endpointAdministratorRole.Priority = 1
	endpointAdministratorRole.Authorizations = authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole()

	err = migrator.store.RoleService.UpdateRole(endpointAdministratorRole.ID, endpointAdministratorRole)

	helpDeskRole, err := migrator.store.RoleService.Role(portainer.RoleID(2))
	if err != nil {
		return err
	}
	helpDeskRole.Priority = 2
	helpDeskRole.Authorizations = authorization.DefaultEndpointAuthorizationsForHelpDeskRole(settings.AllowVolumeBrowserForRegularUsers)

	err = migrator.store.RoleService.UpdateRole(helpDeskRole.ID, helpDeskRole)

	standardUserRole, err := migrator.store.RoleService.Role(portainer.RoleID(3))
	if err != nil {
		return err
	}
	standardUserRole.Priority = 3
	standardUserRole.Authorizations = authorization.DefaultEndpointAuthorizationsForStandardUserRole(settings.AllowVolumeBrowserForRegularUsers)

	err = migrator.store.RoleService.UpdateRole(standardUserRole.ID, standardUserRole)

	readOnlyUserRole, err := migrator.store.RoleService.Role(portainer.RoleID(4))
	if err != nil {
		return err
	}
	readOnlyUserRole.Priority = 4
	readOnlyUserRole.Authorizations = authorization.DefaultEndpointAuthorizationsForReadOnlyUserRole(settings.AllowVolumeBrowserForRegularUsers)

	err = migrator.store.RoleService.UpdateRole(readOnlyUserRole.ID, readOnlyUserRole)
	if err != nil {
		return err
	}

	return migrator.store.AuthorizationService.UpdateUsersAuthorizations()
}

func v20_down_user_and_roles_to_22() error {
	return nil
}
