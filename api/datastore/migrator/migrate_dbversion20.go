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

		if err := m.resourceControlService.Update(resourceControl.ID, &resourceControl); err != nil {
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

		if err := m.userService.Update(user.ID, &user); err != nil {
			return err
		}
	}

	endpointAdministratorRole, err := m.roleService.Read(portainer.RoleID(1))
	if err != nil {
		return err
	}

	endpointAdministratorRole.Priority = 1
	endpointAdministratorRole.Authorizations = authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole()

	if err := m.roleService.Update(endpointAdministratorRole.ID, endpointAdministratorRole); err != nil {
		return err
	}

	helpDeskRole, err := m.roleService.Read(portainer.RoleID(2))
	if err != nil {
		return err
	}

	helpDeskRole.Priority = 2
	helpDeskRole.Authorizations = authorization.DefaultEndpointAuthorizationsForHelpDeskRole(settings.AllowVolumeBrowserForRegularUsers)

	if err := m.roleService.Update(helpDeskRole.ID, helpDeskRole); err != nil {
		return err
	}

	standardUserRole, err := m.roleService.Read(portainer.RoleID(3))
	if err != nil {
		return err
	}

	standardUserRole.Priority = 3
	standardUserRole.Authorizations = authorization.DefaultEndpointAuthorizationsForStandardUserRole(settings.AllowVolumeBrowserForRegularUsers)

	if err := m.roleService.Update(standardUserRole.ID, standardUserRole); err != nil {
		return err
	}

	readOnlyUserRole, err := m.roleService.Read(portainer.RoleID(4))
	if err != nil {
		return err
	}

	readOnlyUserRole.Priority = 4
	readOnlyUserRole.Authorizations = authorization.DefaultEndpointAuthorizationsForReadOnlyUserRole(settings.AllowVolumeBrowserForRegularUsers)

	if err := m.roleService.Update(readOnlyUserRole.ID, readOnlyUserRole); err != nil {
		return err
	}

	return m.authorizationService.UpdateUsersAuthorizations()
}
