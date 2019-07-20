package auth

import portainer "github.com/portainer/portainer/api"

func getUserEndpointAuthorizations(user *portainer.User, endpoints []portainer.Endpoint, endpointGroups []portainer.EndpointGroup, roles []portainer.Role, userMemberships []portainer.TeamMembership) portainer.EndpointAuthorizations {
	endpointAuthorizations := make(portainer.EndpointAuthorizations)

	groupUserAccessPolicies := map[portainer.EndpointGroupID]portainer.UserAccessPolicies{}
	groupTeamAccessPolicies := map[portainer.EndpointGroupID]portainer.TeamAccessPolicies{}
	for _, endpointGroup := range endpointGroups {
		groupUserAccessPolicies[endpointGroup.ID] = endpointGroup.UserAccessPolicies
		groupTeamAccessPolicies[endpointGroup.ID] = endpointGroup.TeamAccessPolicies
	}

	for _, endpoint := range endpoints {
		authorizations := getAuthorizationsFromUserEndpointPolicy(user, &endpoint, roles)
		if len(authorizations) > 0 {
			endpointAuthorizations[endpoint.ID] = authorizations
			continue
		}

		authorizations = getAuthorizationsFromUserEndpointGroupPolicy(user, &endpoint, roles, groupUserAccessPolicies)
		if len(authorizations) > 0 {
			endpointAuthorizations[endpoint.ID] = authorizations
			continue
		}

		authorizations = getAuthorizationsFromTeamEndpointPolicies(userMemberships, &endpoint, roles)
		if len(authorizations) > 0 {
			endpointAuthorizations[endpoint.ID] = authorizations
			continue
		}

		endpointAuthorizations[endpoint.ID] = getAuthorizationsFromTeamEndpointGroupPolicies(userMemberships, &endpoint, roles, groupTeamAccessPolicies)
	}

	return endpointAuthorizations
}

func getAuthorizationsFromUserEndpointPolicy(user *portainer.User, endpoint *portainer.Endpoint, roles []portainer.Role) portainer.Authorizations {
	policyRoles := make([]portainer.RoleID, 0)

	policy, ok := endpoint.UserAccessPolicies[user.ID]
	if ok {
		policyRoles = append(policyRoles, policy.RoleID)
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromUserEndpointGroupPolicy(user *portainer.User, endpoint *portainer.Endpoint, roles []portainer.Role, groupAccessPolicies map[portainer.EndpointGroupID]portainer.UserAccessPolicies) portainer.Authorizations {
	policyRoles := make([]portainer.RoleID, 0)

	policy, ok := groupAccessPolicies[endpoint.GroupID][user.ID]
	if ok {
		policyRoles = append(policyRoles, policy.RoleID)
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromTeamEndpointPolicies(memberships []portainer.TeamMembership, endpoint *portainer.Endpoint, roles []portainer.Role) portainer.Authorizations {
	policyRoles := make([]portainer.RoleID, 0)

	for _, membership := range memberships {
		policy, ok := endpoint.TeamAccessPolicies[membership.TeamID]
		if ok {
			policyRoles = append(policyRoles, policy.RoleID)
		}
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromTeamEndpointGroupPolicies(memberships []portainer.TeamMembership, endpoint *portainer.Endpoint, roles []portainer.Role, groupAccessPolicies map[portainer.EndpointGroupID]portainer.TeamAccessPolicies) portainer.Authorizations {
	policyRoles := make([]portainer.RoleID, 0)

	for _, membership := range memberships {
		policy, ok := groupAccessPolicies[endpoint.GroupID][membership.TeamID]
		if ok {
			policyRoles = append(policyRoles, policy.RoleID)
		}
	}

	return getAuthorizationsFromRoles(policyRoles, roles)
}

func getAuthorizationsFromRoles(roleIdentifiers []portainer.RoleID, roles []portainer.Role) portainer.Authorizations {
	var roleAuthorizations []portainer.Authorizations
	for _, id := range roleIdentifiers {
		for _, role := range roles {
			if role.ID == id {
				roleAuthorizations = append(roleAuthorizations, role.Authorizations)
				break
			}
		}
	}

	processedAuthorizations := make(portainer.Authorizations)
	if len(roleAuthorizations) > 0 {
		processedAuthorizations = roleAuthorizations[0]
		for idx, authorizations := range roleAuthorizations {
			if idx == 0 {
				continue
			}
			processedAuthorizations = mergeAuthorizations(processedAuthorizations, authorizations)
		}
	}

	return processedAuthorizations
}

func mergeAuthorizations(a, b portainer.Authorizations) portainer.Authorizations {
	c := make(map[portainer.Authorization]bool)

	for k := range b {
		if _, ok := a[k]; ok {
			c[k] = true
		}
	}
	return c
}
