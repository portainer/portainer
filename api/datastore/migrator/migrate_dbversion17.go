package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
)

func (m *Migrator) updateUsersToDBVersion18() error {
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
	legacyEndpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		endpoint.UserAccessPolicies = make(database.UserAccessPolicies)
		for _, userID := range endpoint.AuthorizedUsers {
			endpoint.UserAccessPolicies[userID] = database.AccessPolicy{
				RoleID: 4,
			}
		}

		endpoint.TeamAccessPolicies = make(database.TeamAccessPolicies)
		for _, teamID := range endpoint.AuthorizedTeams {
			endpoint.TeamAccessPolicies[teamID] = database.AccessPolicy{
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
	legacyEndpointGroups, err := m.endpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range legacyEndpointGroups {
		endpointGroup.UserAccessPolicies = make(database.UserAccessPolicies)
		for _, userID := range endpointGroup.AuthorizedUsers {
			endpointGroup.UserAccessPolicies[userID] = database.AccessPolicy{
				RoleID: 4,
			}
		}

		endpointGroup.TeamAccessPolicies = make(database.TeamAccessPolicies)
		for _, teamID := range endpointGroup.AuthorizedTeams {
			endpointGroup.TeamAccessPolicies[teamID] = database.AccessPolicy{
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
	legacyRegistries, err := m.registryService.Registries()
	if err != nil {
		return err
	}

	for _, registry := range legacyRegistries {
		registry.UserAccessPolicies = make(database.UserAccessPolicies)
		for _, userID := range registry.AuthorizedUsers {
			registry.UserAccessPolicies[userID] = database.AccessPolicy{}
		}

		registry.TeamAccessPolicies = make(database.TeamAccessPolicies)
		for _, teamID := range registry.AuthorizedTeams {
			registry.TeamAccessPolicies[teamID] = database.AccessPolicy{}
		}

		err = m.registryService.UpdateRegistry(registry.ID, &registry)
		if err != nil {
			return err
		}
	}

	return nil
}
