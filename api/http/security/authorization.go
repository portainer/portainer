package security

import (
	"github.com/portainer/portainer"
)

// AuthorizedResourceControlDeletion ensure that the user can delete a resource control object.
// A non-administrator user cannot delete a resource control where:
// * the Public flag is set
// * he is not one of the users in the user accesses
// * he is not a member of any team within the team accesses
func AuthorizedResourceControlDeletion(resourceControl *portainer.ResourceControl, context *RestrictedRequestContext) bool {
	if context.IsAdmin {
		return true
	}

	if resourceControl.Public {
		return false
	}

	userAccessesCount := len(resourceControl.UserAccesses)
	teamAccessesCount := len(resourceControl.TeamAccesses)

	if teamAccessesCount > 0 {
		for _, access := range resourceControl.TeamAccesses {
			for _, membership := range context.UserMemberships {
				if membership.TeamID == access.TeamID {
					return true
				}
			}
		}
	}

	if userAccessesCount > 0 {
		for _, access := range resourceControl.UserAccesses {
			if access.UserID == context.UserID {
				return true
			}
		}
	}

	return false
}

// AuthorizedResourceControlAccess checks whether the user can alter an existing resource control.
func AuthorizedResourceControlAccess(resourceControl *portainer.ResourceControl, context *RestrictedRequestContext) bool {
	if context.IsAdmin {
		return true
	}

	if resourceControl.Public {
		return false
	}

	authorizedTeamAccess := false
	for _, access := range resourceControl.TeamAccesses {
		for _, membership := range context.UserMemberships {
			if membership.TeamID == access.TeamID {
				authorizedTeamAccess = true
				break
			}
		}
	}
	if !authorizedTeamAccess {
		return false
	}

	authorizedUserAccess := false
	for _, access := range resourceControl.UserAccesses {
		if context.UserID == access.UserID {
			authorizedUserAccess = true
			break
		}
	}
	if !authorizedUserAccess {
		return false
	}

	return true
}

// AuthorizedResourceControlUpdate ensure that the user can update a resource control object.
// It reuses the creation restrictions and adds extra checks.
// A non-administrator user cannot update a resource control where:
// * he wants to put one or more user in the user accesses
func AuthorizedResourceControlUpdate(resourceControl *portainer.ResourceControl, context *RestrictedRequestContext) bool {
	userAccessesCount := len(resourceControl.UserAccesses)
	if !context.IsAdmin && userAccessesCount > 0 {
		return false
	}

	return AuthorizedResourceControlCreation(resourceControl, context)
}

// AuthorizedResourceControlCreation ensure that the user can create a resource control object.
// A non-administrator user cannot create a resource control where:
// * the Public flag is set false
// * he wants to create a resource control without any user/team accesses
// * he wants to add more than one user in the user accesses
// * he wants tp add a user in the user accesses that is not corresponding to its id
// * he wants to add a team he is not a member of
func AuthorizedResourceControlCreation(resourceControl *portainer.ResourceControl, context *RestrictedRequestContext) bool {
	if context.IsAdmin {
		return true
	}

	if resourceControl.Public {
		return true
	}

	userAccessesCount := len(resourceControl.UserAccesses)
	teamAccessesCount := len(resourceControl.TeamAccesses)

	if userAccessesCount == 0 && teamAccessesCount == 0 {
		return false
	}

	if userAccessesCount > 1 || (userAccessesCount == 1 && teamAccessesCount == 1) {
		return false
	}

	if userAccessesCount == 1 {
		access := resourceControl.UserAccesses[0]
		if access.UserID == context.UserID {
			return true
		}
	}

	if teamAccessesCount > 0 {
		for _, access := range resourceControl.TeamAccesses {
			isMember := false
			for _, membership := range context.UserMemberships {
				if membership.TeamID == access.TeamID {
					isMember = true
				}
			}
			if !isMember {
				return false
			}
		}
	}

	return true
}

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

// authorizedEndpointAccess ensure that the user can access the specified endpoint.
// It will check if the user is part of the authorized users or part of a team that is
// listed in the authorized teams of the endpoint and the associated group.
func authorizedEndpointAccess(endpoint *portainer.Endpoint, endpointGroup *portainer.EndpointGroup, userID portainer.UserID, memberships []portainer.TeamMembership) bool {
	groupAccess := authorizedAccess(userID, memberships, endpointGroup.AuthorizedUsers, endpointGroup.AuthorizedTeams)
	if !groupAccess {
		return authorizedAccess(userID, memberships, endpoint.AuthorizedUsers, endpoint.AuthorizedTeams)
	}
	return true
}

// AuthorizedEndpointGroupAccess ensure that the user can access the specified endpoint group.
// It will check if the user is part of the authorized users or part of a team that is
// listed in the authorized teams.
func AuthorizedEndpointGroupAccess(endpointGroup *portainer.EndpointGroup, userID portainer.UserID, memberships []portainer.TeamMembership) bool {
	return authorizedAccess(userID, memberships, endpointGroup.AuthorizedUsers, endpointGroup.AuthorizedTeams)
}

// AuthorizedRegistryAccess ensure that the user can access the specified registry.
// It will check if the user is part of the authorized users or part of a team that is
// listed in the authorized teams.
func AuthorizedRegistryAccess(registry *portainer.Registry, userID portainer.UserID, memberships []portainer.TeamMembership) bool {
	return authorizedAccess(userID, memberships, registry.AuthorizedUsers, registry.AuthorizedTeams)
}

func authorizedAccess(userID portainer.UserID, memberships []portainer.TeamMembership, authorizedUsers []portainer.UserID, authorizedTeams []portainer.TeamID) bool {
	for _, authorizedUserID := range authorizedUsers {
		if authorizedUserID == userID {
			return true
		}
	}
	for _, membership := range memberships {
		for _, authorizedTeamID := range authorizedTeams {
			if membership.TeamID == authorizedTeamID {
				return true
			}
		}
	}
	return false
}
