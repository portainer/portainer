package migrator

import (
	portainer "github.com/portainer/portainer/api"
)

func (m *Migrator) updateUsersToDBVersion18() error {
	migrateLog.Info("- updating users")
	legacyUsers, err := m.userService.Users()
	if err != nil {
		return err
	}

	for _, user := range legacyUsers {
		user.PortainerAuthorizations = map[portainer.Authorization]bool{
			portainer.OperationPortainerDockerHubInspect:        true,
			portainer.OperationPortainerEndpointGroupList:       true,
			portainer.OperationPortainerEndpointList:            true,
			portainer.OperationPortainerEndpointInspect:         true,
			portainer.OperationPortainerEndpointExtensionAdd:    true,
			portainer.OperationPortainerEndpointExtensionRemove: true,
			portainer.OperationPortainerExtensionList:           true,
			portainer.OperationPortainerMOTD:                    true,
			portainer.OperationPortainerRegistryList:            true,
			portainer.OperationPortainerRegistryInspect:         true,
			portainer.OperationPortainerTeamList:                true,
			portainer.OperationPortainerTemplateList:            true,
			portainer.OperationPortainerTemplateInspect:         true,
			portainer.OperationPortainerUserList:                true,
			portainer.OperationPortainerUserMemberships:         true,
		}

		err = m.userService.UpdateUser(user.ID, &user)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateEndpointsToDBVersion18() error {
	migrateLog.Info("- updating endpoints")
	legacyEndpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		endpoint.UserAccessPolicies = make(portainer.UserAccessPolicies)
		for _, userID := range endpoint.AuthorizedUsers {
			endpoint.UserAccessPolicies[userID] = portainer.AccessPolicy{
				RoleID: 4,
			}
		}

		endpoint.TeamAccessPolicies = make(portainer.TeamAccessPolicies)
		for _, teamID := range endpoint.AuthorizedTeams {
			endpoint.TeamAccessPolicies[teamID] = portainer.AccessPolicy{
				RoleID: 4,
			}
		}

		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateEndpointGroupsToDBVersion18() error {
	migrateLog.Info("- updating endpoint groups")
	legacyEndpointGroups, err := m.endpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range legacyEndpointGroups {
		endpointGroup.UserAccessPolicies = make(portainer.UserAccessPolicies)
		for _, userID := range endpointGroup.AuthorizedUsers {
			endpointGroup.UserAccessPolicies[userID] = portainer.AccessPolicy{
				RoleID: 4,
			}
		}

		endpointGroup.TeamAccessPolicies = make(portainer.TeamAccessPolicies)
		for _, teamID := range endpointGroup.AuthorizedTeams {
			endpointGroup.TeamAccessPolicies[teamID] = portainer.AccessPolicy{
				RoleID: 4,
			}
		}

		err = m.endpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateRegistriesToDBVersion18() error {
	migrateLog.Info("- updating registries")
	legacyRegistries, err := m.registryService.Registries()
	if err != nil {
		return err
	}

	for _, registry := range legacyRegistries {
		registry.UserAccessPolicies = make(portainer.UserAccessPolicies)
		for _, userID := range registry.AuthorizedUsers {
			registry.UserAccessPolicies[userID] = portainer.AccessPolicy{}
		}

		registry.TeamAccessPolicies = make(portainer.TeamAccessPolicies)
		for _, teamID := range registry.AuthorizedTeams {
			registry.TeamAccessPolicies[teamID] = portainer.AccessPolicy{}
		}

		err = m.registryService.UpdateRegistry(registry.ID, &registry)
		if err != nil {
			return err
		}
	}

	return nil
}
