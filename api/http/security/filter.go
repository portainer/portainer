package security

import "github.com/portainer/portainer"

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
func FilterRegistries(registries []portainer.Registry, context *RestrictedRequestContext) ([]portainer.Registry, error) {

	filteredRegistries := registries
	if !context.IsAdmin {
		filteredRegistries = make([]portainer.Registry, 0)

		for _, registry := range registries {
			if AuthorizedRegistryAccess(&registry, context.UserID, context.UserMemberships) {
				filteredRegistries = append(filteredRegistries, registry)
			}
		}
	}

	return filteredRegistries, nil
}

// FilterEndpoints filters endpoints based on user role and team memberships.
// Non administrator users only have access to authorized endpoints.
func FilterEndpoints(endpoints []portainer.Endpoint, context *RestrictedRequestContext) ([]portainer.Endpoint, error) {
	filteredEndpoints := endpoints

	if !context.IsAdmin {
		filteredEndpoints = make([]portainer.Endpoint, 0)

		for _, endpoint := range endpoints {
			if AuthorizedEndpointAccess(&endpoint, context.UserID, context.UserMemberships) {
				filteredEndpoints = append(filteredEndpoints, endpoint)
			}
		}
	}

	return filteredEndpoints, nil
}

// FilterEndpointGroups filters endpoint groups based on user role and team memberships.
// Non administrator users only have access to authorized endpoint groups.
func FilterEndpointGroups(endpointGroups []portainer.EndpointGroup, context *RestrictedRequestContext) ([]portainer.EndpointGroup, error) {
	filteredEndpointGroups := endpointGroups

	if !context.IsAdmin {
		filteredEndpointGroups = make([]portainer.EndpointGroup, 0)

		for _, group := range endpointGroups {
			if AuthorizedEndpointGroupAccess(&group, context.UserID, context.UserMemberships) {
				filteredEndpointGroups = append(filteredEndpointGroups, group)
			}
		}
	}

	return filteredEndpointGroups, nil
}
