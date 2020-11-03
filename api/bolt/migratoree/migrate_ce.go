package migratoree

import (
	"log"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/authorization"
)

// MigrateFromCEdbv25 will migrate the db from latest ce version to latest ee version
func (m *Migrator) MigrateFromCEdbv25() error {
	log.Printf("[INFO] [bolt, migrate] Updating LDAP settings to EE.")
	err := m.updateSettingsToEE()
	if err != nil {
		return err
	}

	log.Printf("[INFO] [bolt, migrate] Updating user roles to EE.")
	err = m.updateUserRolesToEE()
	if err != nil {
		return err
	}
	log.Printf("[INFO] [bolt, migrate] Updating role authorizations to EE.")
	err = m.updateRoleAuthorizationsToEE()
	if err != nil {
		return err
	}
	log.Printf("[INFO] [bolt, migrate] Updating user authorizations.")
	err = m.authorizationService.UpdateUsersAuthorizations()
	if err != nil {
		return err
	}

	log.Printf("[INFO] [bolt, migrate] Updating LDAP settings to EE.")
	err = m.updateSettingsToEE()
	if err != nil {
		return err
	}

	log.Printf("[INFO] [bolt, migrate] Setting db version to %v.", portainer.DBVersionEE)
	err = m.versionService.StoreDBVersion(portainer.DBVersionEE)
	if err != nil {
		return err
	}

	log.Printf("[INFO] [bolt, migrate] Setting edition to %v.", portainer.PortainerEE)
	err = m.versionService.StoreEdition(portainer.PortainerEE)
	if err != nil {
		return err
	}

	return nil
}

func (m *Migrator) updateSettingsToEE() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.LDAPSettings.URLs = []string{}
	url := legacySettings.LDAPSettings.URL
	if url != "" {
		legacySettings.LDAPSettings.URLs = append(legacySettings.LDAPSettings.URLs, url)
	}

	legacySettings.LDAPSettings.ServerType = portainer.LDAPServerCustom

	return m.settingsService.UpdateSettings(legacySettings)
}

// Updating role authorizations because of the new policies in Kube RBAC
func (m *Migrator) updateRoleAuthorizationsToEE() error {
	log.Printf("[DEBUG] [bolt, migrate] Retriving settings")
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	log.Printf("[DEBUG] [bolt, migrate] Updating Endpoint Admin Role")
	endpointAdministratorRole, err := m.roleService.Role(portainer.RoleID(1))
	if err != nil {
		return err
	}
	endpointAdministratorRole.Priority = 1
	endpointAdministratorRole.Authorizations = authorization.DefaultEndpointAuthorizationsForEndpointAdministratorRole()

	err = m.roleService.UpdateRole(endpointAdministratorRole.ID, endpointAdministratorRole)

	log.Printf("[DEBUG] [bolt, migrate] Updating Help Desk Role")
	helpDeskRole, err := m.roleService.Role(portainer.RoleID(2))
	if err != nil {
		return err
	}
	helpDeskRole.Priority = 2
	helpDeskRole.Authorizations = authorization.DefaultEndpointAuthorizationsForHelpDeskRole(settings.AllowVolumeBrowserForRegularUsers)

	err = m.roleService.UpdateRole(helpDeskRole.ID, helpDeskRole)

	log.Printf("[DEBUG] [bolt, migrate] Updating Standard User Role")
	standardUserRole, err := m.roleService.Role(portainer.RoleID(3))
	if err != nil {
		return err
	}
	standardUserRole.Priority = 3
	standardUserRole.Authorizations = authorization.DefaultEndpointAuthorizationsForStandardUserRole(settings.AllowVolumeBrowserForRegularUsers)

	err = m.roleService.UpdateRole(standardUserRole.ID, standardUserRole)

	log.Printf("[DEBUG] [bolt, migrate] Updating Read Only User Role")
	readOnlyUserRole, err := m.roleService.Role(portainer.RoleID(4))
	if err != nil {
		return err
	}
	readOnlyUserRole.Priority = 4
	readOnlyUserRole.Authorizations = authorization.DefaultEndpointAuthorizationsForReadOnlyUserRole(settings.AllowVolumeBrowserForRegularUsers)

	err = m.roleService.UpdateRole(readOnlyUserRole.ID, readOnlyUserRole)
	if err != nil {
		return err
	}

	return nil
}

// If RBAC extension wasn't installed before, update all users in endpoints and
// endpoint groups to have read only access.
func (m *Migrator) updateUserRolesToEE() error {
	err := m.updateUserAuthorizationToEE()
	if err != nil {
		return err
	}

	log.Printf("[DEBUG] [bolt, migrate] Retriving extension info")
	extensions, err := m.extensionService.Extensions()
	for _, extension := range extensions {
		if extension.ID == 3 && extension.Enabled {
			log.Printf("[INFO] [bolt, migrate] RBAC extensions were enabled before; Skip updating User Roles")
			return nil
		}
	}

	log.Printf("[DEBUG] [bolt, migrate] Retriving endpoint groups")
	endpointGroups, err := m.endpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		log.Printf("[DEBUG] [bolt, migrate] Updating user policies for endpoint group %v", endpointGroup.ID)
		for key := range endpointGroup.UserAccessPolicies {
			updateUserAccessPolicyToReadOnlyRole(endpointGroup.UserAccessPolicies, key)
		}

		for key := range endpointGroup.TeamAccessPolicies {
			updateTeamAccessPolicyToReadOnlyRole(endpointGroup.TeamAccessPolicies, key)
		}

		err := m.endpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
		if err != nil {
			return err
		}
	}

	log.Printf("[DEBUG] [bolt, migrate] Retriving endpoints")
	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		log.Printf("[DEBUG] [bolt, migrate] Updating user policies for endpoint %v", endpoint.ID)
		for key := range endpoint.UserAccessPolicies {
			updateUserAccessPolicyToReadOnlyRole(endpoint.UserAccessPolicies, key)
		}

		for key := range endpoint.TeamAccessPolicies {
			updateTeamAccessPolicyToReadOnlyRole(endpoint.TeamAccessPolicies, key)
		}

		err := m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateUserAuthorizationToEE() error {
	legacyUsers, err := m.userService.Users()
	if err != nil {
		return err
	}

	for _, user := range legacyUsers {
		user.PortainerAuthorizations = authorization.DefaultPortainerAuthorizations()

		err = m.userService.UpdateUser(user.ID, &user)
		if err != nil {
			return err
		}
	}

	return nil
}

func updateUserAccessPolicyToNoRole(policies portainer.UserAccessPolicies, key portainer.UserID) {
	tmp := policies[key]
	tmp.RoleID = 0
	policies[key] = tmp
}

func updateTeamAccessPolicyToNoRole(policies portainer.TeamAccessPolicies, key portainer.TeamID) {
	tmp := policies[key]
	tmp.RoleID = 0
	policies[key] = tmp
}

func updateUserAccessPolicyToReadOnlyRole(policies portainer.UserAccessPolicies, key portainer.UserID) {
	tmp := policies[key]
	tmp.RoleID = 4
	policies[key] = tmp
}

func updateTeamAccessPolicyToReadOnlyRole(policies portainer.TeamAccessPolicies, key portainer.TeamID) {
	tmp := policies[key]
	tmp.RoleID = 4
	policies[key] = tmp
}
