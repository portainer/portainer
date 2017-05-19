package security

import "github.com/portainer/portainer"

// AuthorizedTeamManagement ensure that access to the management of the specified team is granted.
// It will check if the user is either administrator or leader of that team.
func AuthorizedTeamManagement(teamID portainer.TeamID, context *RestrictedRequestContext) bool {
	if context.IsAdmin {
		return true
	}

	for _, membership := range context.UserMemberships {
		if membership.TeamID == teamID && membership.Role == portainer.TeamLeader {
			return true
		}
	}

	return false
}

// AuthorizedUserManagement ensure that access to the management of the specified user is granted.
// It will check if the user is either administrator or the owner of the user account.
func AuthorizedUserManagement(userID portainer.UserID, context *RestrictedRequestContext) bool {
	if context.IsAdmin || context.UserID == userID {
		return true
	}
	return false
}
