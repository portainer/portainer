package authorization

import portainer "github.com/portainer/portainer/api"

func (service *Service) CleanupNamespaceAccessPoliciesWithOverridePolicies(
	endpoint *portainer.Endpoint,
	endpointGroup *portainer.EndpointGroup,
) error {

	kubecli, err := service.K8sClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return err
	}

	accessPolicies, err := kubecli.GetNamespaceAccessPolicies()
	if err != nil {
		return err
	}

	users, err := service.dataStore.User().Users()
	if err != nil {
		return err
	}

	teams, err := service.dataStore.Team().Teams()
	if err != nil {
		return err
	}

	hasChange := false

	for _, team := range teams {
		for namespace, _ := range accessPolicies {
			_, ok := accessPolicies[namespace].TeamAccessPolicies[team.ID]
			if ok {
				endpointRole, err := service.GetTeamEndpointRoleWithOverridePolicies(team.ID, endpoint, endpointGroup)
				if err != nil {
					return err
				}
				if endpointRole == nil {
					delete(accessPolicies[namespace].TeamAccessPolicies, team.ID)
					hasChange = true
				}
			}
		}
	}

	for _, user := range users {
		for namespace, _ := range accessPolicies {
			_, ok := accessPolicies[namespace].UserAccessPolicies[user.ID]
			if ok {
				endpointRole, err := service.GetUserEndpointRoleWithOverridePolicies(user.ID, endpoint, endpointGroup)
				if err != nil {
					return err
				}
				if endpointRole == nil {
					delete(accessPolicies[namespace].UserAccessPolicies, user.ID)
					hasChange = true
				}

			}
		}
	}

	if hasChange {
		err = kubecli.UpdateNamespaceAccessPolicies(accessPolicies)
		if err != nil {
			return err
		}
	}

	return nil
}

func (service *Service) GetUserEndpointRoleWithOverridePolicies(
	userID portainer.UserID,
	endpoint *portainer.Endpoint,
	endpointGroup *portainer.EndpointGroup,
) (*portainer.Role, error) {
	user, err := service.dataStore.User().User(portainer.UserID(userID))
	if err != nil {
		return nil, err
	}

	userMemberships, err := service.dataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return nil, err
	}

	endpointGroups, err := service.dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return nil, err
	}

	if endpointGroup != nil {
		endpointGroups[endpointGroup.ID] = *endpointGroup
	}

	roles, err := service.dataStore.Role().Roles()
	if err != nil {
		return nil, err
	}

	groupUserAccessPolicies, groupTeamAccessPolicies := getGroupPolicies(endpointGroups)

	return getUserEndpointRole(user, *endpoint, groupUserAccessPolicies, groupTeamAccessPolicies, roles, userMemberships), nil
}

func (service *Service) GetTeamEndpointRoleWithOverridePolicies(
	teamID portainer.TeamID,
	endpoint *portainer.Endpoint,
	endpointGroup *portainer.EndpointGroup,
) (*portainer.Role, error) {

	memberships, err := service.dataStore.TeamMembership().TeamMembershipsByTeamID(teamID)
	if err != nil {
		return nil, err
	}

	endpointGroups, err := service.dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return nil, err
	}

	if endpointGroup != nil {
		endpointGroups[endpointGroup.ID] = *endpointGroup
	}

	roles, err := service.dataStore.Role().Roles()
	if err != nil {
		return nil, err
	}

	_, groupTeamAccessPolicies := getGroupPolicies(endpointGroups)

	role := getRoleFromTeamAccessPolicies(memberships, endpoint.TeamAccessPolicies, roles)
	if role != nil {
		return role, nil
	}

	role = getRoleFromTeamEndpointGroupPolicies(memberships, endpoint, roles, groupTeamAccessPolicies)
	return role, nil
}
