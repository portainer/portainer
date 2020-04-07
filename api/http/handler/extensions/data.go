package extensions

import (
	portainer "github.com/portainer/portainer/api"
)

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

func (handler *Handler) upgradeRBACData() error {
	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		for key := range endpointGroup.UserAccessPolicies {
			updateUserAccessPolicyToReadOnlyRole(endpointGroup.UserAccessPolicies, key)
		}

		for key := range endpointGroup.TeamAccessPolicies {
			updateTeamAccessPolicyToReadOnlyRole(endpointGroup.TeamAccessPolicies, key)
		}

		err := handler.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
		if err != nil {
			return err
		}
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		for key := range endpoint.UserAccessPolicies {
			updateUserAccessPolicyToReadOnlyRole(endpoint.UserAccessPolicies, key)
		}

		for key := range endpoint.TeamAccessPolicies {
			updateTeamAccessPolicyToReadOnlyRole(endpoint.TeamAccessPolicies, key)
		}

		err := handler.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return handler.AuthorizationService.UpdateUsersAuthorizations()
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

func (handler *Handler) downgradeRBACData() error {
	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, endpointGroup := range endpointGroups {
		for key := range endpointGroup.UserAccessPolicies {
			updateUserAccessPolicyToNoRole(endpointGroup.UserAccessPolicies, key)
		}

		for key := range endpointGroup.TeamAccessPolicies {
			updateTeamAccessPolicyToNoRole(endpointGroup.TeamAccessPolicies, key)
		}

		err := handler.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
		if err != nil {
			return err
		}
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		for key := range endpoint.UserAccessPolicies {
			updateUserAccessPolicyToNoRole(endpoint.UserAccessPolicies, key)
		}

		for key := range endpoint.TeamAccessPolicies {
			updateTeamAccessPolicyToNoRole(endpoint.TeamAccessPolicies, key)
		}

		err := handler.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return handler.AuthorizationService.UpdateUsersAuthorizations()
}
