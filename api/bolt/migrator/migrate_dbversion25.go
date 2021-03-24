package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/authorization"
)

func (m *Migrator) updateEndpointSettingsToDB26() error {
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for i := range endpoints {
		endpoint := endpoints[i]

		securitySettings := portainer.EndpointSecuritySettings{}

		if endpoint.Type == portainer.EdgeAgentOnDockerEnvironment ||
			endpoint.Type == portainer.AgentOnDockerEnvironment ||
			endpoint.Type == portainer.DockerEnvironment {

			securitySettings = portainer.EndpointSecuritySettings{
				AllowBindMountsForRegularUsers:            settings.AllowBindMountsForRegularUsers,
				AllowContainerCapabilitiesForRegularUsers: settings.AllowContainerCapabilitiesForRegularUsers,
				AllowDeviceMappingForRegularUsers:         settings.AllowDeviceMappingForRegularUsers,
				AllowHostNamespaceForRegularUsers:         settings.AllowHostNamespaceForRegularUsers,
				AllowPrivilegedModeForRegularUsers:        settings.AllowPrivilegedModeForRegularUsers,
				AllowStackManagementForRegularUsers:       settings.AllowStackManagementForRegularUsers,
			}

			if endpoint.Type == portainer.AgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnDockerEnvironment {
				securitySettings.AllowVolumeBrowserForRegularUsers = settings.AllowVolumeBrowserForRegularUsers
				securitySettings.EnableHostManagementFeatures = settings.EnableHostManagementFeatures
			}
		}

		endpoint.SecuritySettings = securitySettings

		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateRbacRolesToDB26() error {
	defaultAuthorizationsOfRoles := map[portainer.RoleID]portainer.Authorizations{
		portainer.RoleIDEndpointAdmin: authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole(),
		portainer.RoleIDHelpdesk:      authorization.DefaultEndpointAuthorizationsForHelpDeskRole(),
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
