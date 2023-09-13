package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/authorization"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) updateResourceControlsToDBVersion22() error {
	log.Info().Msg("updating resource controls")

	legacyResourceControls, err := m.resourceControlService.ReadAll()
	if err != nil {
		return err
	}

	for _, resourceControl := range legacyResourceControls {
		resourceControl.AdministratorsOnly = false

		err := m.resourceControlService.Update(resourceControl.ID, &resourceControl)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateUsersAndRolesToDBVersion22() error {
	log.Info().Msg("updating users and roles")

	legacyUsers, err := m.userService.ReadAll()
	if err != nil {
		return err
	}

	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	for _, user := range legacyUsers {
		user.PortainerAuthorizations = authorization.DefaultPortainerAuthorizations()
		err = m.userService.Update(user.ID, &user)
		if err != nil {
			return err
		}
	}

	endpointAdministratorRole, err := m.roleService.Read(portainer.RoleID(1))
	if err != nil {
		return err
	}
	endpointAdministratorRole.Priority = 1
	endpointAdministratorRole.Authorizations = authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole()

	err = m.roleService.Update(endpointAdministratorRole.ID, endpointAdministratorRole)

	helpDeskRole, err := m.roleService.Read(portainer.RoleID(2))
	if err != nil {
		return err
	}
	helpDeskRole.Priority = 2
	helpDeskRole.Authorizations = authorization.DefaultEndpointAuthorizationsForHelpDeskRole(settings.AllowVolumeBrowserForRegularUsers)

	err = m.roleService.Update(helpDeskRole.ID, helpDeskRole)

	standardUserRole, err := m.roleService.Read(portainer.RoleID(3))
	if err != nil {
		return err
	}
	standardUserRole.Priority = 3
	standardUserRole.Authorizations = authorization.DefaultEndpointAuthorizationsForStandardUserRole(settings.AllowVolumeBrowserForRegularUsers)

	err = m.roleService.Update(standardUserRole.ID, standardUserRole)

	readOnlyUserRole, err := m.roleService.Read(portainer.RoleID(4))
	if err != nil {
		return err
	}
	readOnlyUserRole.Priority = 4
	readOnlyUserRole.Authorizations = authorization.DefaultEndpointAuthorizationsForReadOnlyUserRole(settings.AllowVolumeBrowserForRegularUsers)

	err = m.roleService.Update(readOnlyUserRole.ID, readOnlyUserRole)
	if err != nil {
		return err
	}

	return m.authorizationService.UpdateUsersAuthorizations()
}
