package security

import "github.com/portainer/portainer"

// FilterUsers filters users based on user role.
// Team leaders only have access to non-administrator users.
func FilterUsers(users []portainer.User, context *RestrictedRequestContext) []portainer.User {
	filteredUsers := users

	if context.IsTeamLeader {
		filteredUsers = make([]portainer.User, 0)

		for _, user := range users {
			if user.Role != portainer.AdministratorRole {
				filteredUsers = append(filteredUsers, user)
			}
		}
	}

	return filteredUsers
}

// FilterEndpoints filters endpoints based on user role and team memberships.
// Non administrator users only have access to authorized endpoints.
func FilterEndpoints(endpoints []portainer.Endpoint, context *RestrictedRequestContext) ([]portainer.Endpoint, error) {
	filteredEndpoints := endpoints

	if !context.IsAdmin {
		filteredEndpoints = make([]portainer.Endpoint, 0)

		for _, endpoint := range endpoints {
			if isEndpointAccessAuthorized(&endpoint, context.UserID, context.UserMemberships) {
				filteredEndpoints = append(filteredEndpoints, endpoint)
			}
		}
	}

	return filteredEndpoints, nil
}

func isEndpointAccessAuthorized(endpoint *portainer.Endpoint, userID portainer.UserID, memberships []portainer.TeamMembership) bool {
	for _, authorizedUserID := range endpoint.AuthorizedUsers {
		if authorizedUserID == userID {
			return true
		}
	}
	for _, membership := range memberships {
		for _, authorizedTeamID := range endpoint.AuthorizedTeams {
			if membership.TeamID == authorizedTeamID {
				return true
			}
		}
	}
	return false
}
