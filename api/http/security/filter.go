package security

import (
	portainer "github.com/portainer/portainer/api"
)

// FilterUserTeams filters teams based on user role.
// non-administrator users only have access to team they are member of.
func FilterUserTeams(teams []portainer.Team, context *RestrictedRequestContext) []portainer.Team {
	if context.IsAdmin {
		return teams
	}

	n := 0
	for _, membership := range context.UserMemberships {
		for _, team := range teams {
			if team.ID == membership.TeamID {
				teams[n] = team
				n++

				break
			}
		}
	}

	return teams[:n]
}

// FilterLeaderTeams filters teams based on user role.
// Team leaders only have access to team they lead.
func FilterLeaderTeams(teams []portainer.Team, context *RestrictedRequestContext) []portainer.Team {
	n := 0

	if !context.IsTeamLeader {
		return teams[:n]
	}

	leaderSet := map[portainer.TeamID]bool{}
	for _, membership := range context.UserMemberships {
		if membership.Role == portainer.TeamLeader && membership.UserID == context.UserID {
			leaderSet[membership.TeamID] = true
		}
	}

	for _, team := range teams {
		if leaderSet[team.ID] {
			teams[n] = team
			n++
		}
	}

	return teams[:n]
}

// FilterUsers filters users based on user role.
// Non-administrator users only have access to non-administrator users.
func FilterUsers(users []portainer.User, context *RestrictedRequestContext) []portainer.User {
	if context.IsAdmin {
		return users
	}

	n := 0
	for _, user := range users {
		if user.Role != portainer.AdministratorRole {
			users[n] = user
			n++
		}
	}

	return users[:n]
}

// FilterRegistries filters registries based on user role and team memberships.
// Non administrator users only have access to authorized registries.
func FilterRegistries(registries []portainer.Registry, user *portainer.User, teamMemberships []portainer.TeamMembership, endpointID portainer.EndpointID) []portainer.Registry {
	if user.Role == portainer.AdministratorRole {
		return registries
	}

	n := 0
	for _, registry := range registries {
		if AuthorizedRegistryAccess(&registry, user, teamMemberships, endpointID) {
			registries[n] = registry
			n++
		}
	}

	return registries[:n]
}

// FilterEndpoints filters environments(endpoints) based on user role and team memberships.
// Non administrator only have access to authorized environments(endpoints) (can be inherited via endpoint groups).
func FilterEndpoints(endpoints []portainer.Endpoint, groups []portainer.EndpointGroup, context *RestrictedRequestContext) []portainer.Endpoint {
	if context.IsAdmin {
		return endpoints
	}

	n := 0
	for _, endpoint := range endpoints {
		endpointGroup := getAssociatedGroup(&endpoint, groups)

		if AuthorizedEndpointAccess(&endpoint, endpointGroup, context.UserID, context.UserMemberships) {
			endpoint.UserAccessPolicies = nil
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
}

// FilterEndpointGroups filters environment(endpoint) groups based on user role and team memberships.
// Non administrator users only have access to authorized environment(endpoint) groups.
func FilterEndpointGroups(endpointGroups []portainer.EndpointGroup, context *RestrictedRequestContext) []portainer.EndpointGroup {
	if context.IsAdmin {
		return endpointGroups
	}

	n := 0
	for _, group := range endpointGroups {
		if authorizedEndpointGroupAccess(&group, context.UserID, context.UserMemberships) {
			endpointGroups[n] = group
			n++
		}
	}

	return endpointGroups[:n]
}

func getAssociatedGroup(endpoint *portainer.Endpoint, groups []portainer.EndpointGroup) *portainer.EndpointGroup {
	for _, group := range groups {
		if group.ID == endpoint.GroupID {
			return &group
		}
	}

	return nil
}
