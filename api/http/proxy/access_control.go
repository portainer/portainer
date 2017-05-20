package proxy

import "github.com/portainer/portainer"

func canUserAccessResource(userID portainer.UserID, userTeamIDs []portainer.TeamID, resourceControl *portainer.ResourceControl) bool {
	for _, authorizedUserAccess := range resourceControl.UserAccesses {
		if userID == authorizedUserAccess.UserID {
			return true
		}
	}

	for _, authorizedTeamAccess := range resourceControl.TeamAccesses {
		for _, userTeamID := range userTeamIDs {
			if userTeamID == authorizedTeamAccess.TeamID {
				return true
			}
		}
	}

	return false
}
