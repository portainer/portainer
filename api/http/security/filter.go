package security

import (
	portainer "github.com/portainer/portainer/api"
)

// FilterUserTeams filters teams based on user role.
// non-administrator users only have access to team they are member of.
func FilterUserTeams(teams []portainer.Team, context *RestrictedRequestContext) []portainer.Team {
	filteredTeams := teams

	if !context.IsAdmin {
		filteredTeams = make([]portainer.Team, 0)
		for _, membership := range context.UserMemberships {
			for _, team := range teams {
				if team.ID == membership.TeamID {
					filteredTeams = append(filteredTeams, team)
					break
				}
			}
		}
	}

	return filteredTeams
}

// FilterLeaderTeams filters teams based on user role.
// Team leaders only have access to team they lead.
func FilterLeaderTeams(teams []portainer.Team, context *RestrictedRequestContext) []portainer.Team {
	filteredTeams := teams

	if context.IsTeamLeader {
		filteredTeams = make([]portainer.Team, 0)
		for _, membership := range context.UserMemberships {
			for _, team := range teams {
				if team.ID == membership.TeamID && membership.Role == portainer.TeamLeader {
					filteredTeams = append(filteredTeams, team)
					break
				}
			}
		}
	}

	return filteredTeams
}

// FilterUsers filters users based on user role.
// Non-administrator users only have access to non-administrator users.
func FilterUsers(users []portainer.User, context *RestrictedRequestContext) []portainer.User {
	filteredUsers := users

	if !context.IsAdmin {
		filteredUsers = make([]portainer.User, 0)

		for _, user := range users {
			if user.Role != portainer.AdministratorRole {
				filteredUsers = append(filteredUsers, user)
			}
		}
	}

	return filteredUsers
}

// FilterRegistries filters registries based on user role and team memberships.
// Non administrator users only have access to authorized registries.
func FilterRegistries(registries []portainer.Registry, user *portainer.User, teamMemberships []portainer.TeamMembership, endpointID portainer.EndpointID) []portainer.Registry {
	if user.Role == portainer.AdministratorRole {
		return registries
	}

	filteredRegistries := []portainer.Registry{}

	for _, registry := range registries {
		if AuthorizedRegistryAccess(&registry, user, teamMemberships, endpointID) {
			filteredRegistries = append(filteredRegistries, registry)
		}
	}

	return filteredRegistries
}

// FilterEndpoints filters environments(endpoints) based on user role and team memberships.
// Non administrator users only have access to authorized environments(endpoints) (can be inherited via endpoint groups).
func FilterEndpoints(endpoints []portainer.Endpoint, groups []portainer.EndpointGroup, context *RestrictedRequestContext) []portainer.Endpoint {
	filteredEndpoints := endpoints

	if !context.IsAdmin {
		filteredEndpoints = make([]portainer.Endpoint, 0)

		for _, endpoint := range endpoints {
			endpointGroup := getAssociatedGroup(&endpoint, groups)

			if authorizedEndpointAccess(&endpoint, endpointGroup, context.UserID, context.UserMemberships) {
				filteredEndpoints = append(filteredEndpoints, endpoint)
			}
		}
	}

	return filteredEndpoints
}

// FilterEndpointGroups filters environment(endpoint) groups based on user role and team memberships.
// Non administrator users only have access to authorized environment(endpoint) groups.
func FilterEndpointGroups(endpointGroups []portainer.EndpointGroup, context *RestrictedRequestContext) []portainer.EndpointGroup {
	filteredEndpointGroups := endpointGroups

	if !context.IsAdmin {
		filteredEndpointGroups = make([]portainer.EndpointGroup, 0)

		for _, group := range endpointGroups {
			if authorizedEndpointGroupAccess(&group, context.UserID, context.UserMemberships) {
				filteredEndpointGroups = append(filteredEndpointGroups, group)
			}
		}
	}

	return filteredEndpointGroups
}

func getAssociatedGroup(endpoint *portainer.Endpoint, groups []portainer.EndpointGroup) *portainer.EndpointGroup {
	for _, group := range groups {
		if group.ID == endpoint.GroupID {
			return &group
		}
	}
	return nil
}
