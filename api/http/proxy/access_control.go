package proxy

import "github.com/portainer/portainer"

func isResourceAccessAuthorized(userID portainer.UserID, userTeamIDs []portainer.TeamID, resourceID string, resourceControls []portainer.ResourceControl) bool {
	resourceControl := getResourceControlByResourceID(resourceID, resourceControls)

	if resourceControl == nil {
		return true
	}

	return canUserAccessResource(userID, userTeamIDs, resourceControl)
}

func canUserAccessResource(userID portainer.UserID, userTeamIDs []portainer.TeamID, resourceControl *portainer.ResourceControl) bool {
	for _, authorizedUserID := range resourceControl.Users {
		if userID == authorizedUserID {
			return true
		}
	}

	for _, authorizedTeamID := range resourceControl.Teams {
		for _, userTeamID := range userTeamIDs {
			if userTeamID == authorizedTeamID {
				return true
			}
		}
	}
	return false
}
