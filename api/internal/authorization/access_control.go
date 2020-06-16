package authorization

import "github.com/portainer/portainer/api"

// NewPrivateResourceControl will create a new private resource control associated to the resource specified by the
// identifier and type parameters. It automatically assigns it to the user specified by the userID parameter.
func NewPrivateResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType, userID portainer.UserID) *portainer.ResourceControl {
	return &portainer.ResourceControl{
		Type:           resourceType,
		ResourceID:     resourceIdentifier,
		SubResourceIDs: []string{},
		UserAccesses: []portainer.UserResourceAccess{
			{
				UserID:      userID,
				AccessLevel: portainer.ReadWriteAccessLevel,
			},
		},
		TeamAccesses:       []portainer.TeamResourceAccess{},
		AdministratorsOnly: false,
		Public:             false,
		System:             false,
	}
}

// NewSystemResourceControl will create a new public resource control with the System flag set to true.
// These kind of resource control are not persisted and are created on the fly by the Portainer API.
func NewSystemResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType) *portainer.ResourceControl {
	return &portainer.ResourceControl{
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		SubResourceIDs:     []string{},
		UserAccesses:       []portainer.UserResourceAccess{},
		TeamAccesses:       []portainer.TeamResourceAccess{},
		AdministratorsOnly: false,
		Public:             true,
		System:             true,
	}
}

// NewPublicResourceControl will create a new public resource control.
func NewPublicResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType) *portainer.ResourceControl {
	return &portainer.ResourceControl{
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		SubResourceIDs:     []string{},
		UserAccesses:       []portainer.UserResourceAccess{},
		TeamAccesses:       []portainer.TeamResourceAccess{},
		AdministratorsOnly: false,
		Public:             true,
		System:             false,
	}
}

// NewRestrictedResourceControl will create a new resource control with user and team accesses restrictions.
func NewRestrictedResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType, userIDs []portainer.UserID, teamIDs []portainer.TeamID) *portainer.ResourceControl {
	userAccesses := make([]portainer.UserResourceAccess, 0)
	teamAccesses := make([]portainer.TeamResourceAccess, 0)

	for _, id := range userIDs {
		access := portainer.UserResourceAccess{
			UserID:      id,
			AccessLevel: portainer.ReadWriteAccessLevel,
		}

		userAccesses = append(userAccesses, access)
	}

	for _, id := range teamIDs {
		access := portainer.TeamResourceAccess{
			TeamID:      id,
			AccessLevel: portainer.ReadWriteAccessLevel,
		}

		teamAccesses = append(teamAccesses, access)
	}

	return &portainer.ResourceControl{
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		SubResourceIDs:     []string{},
		UserAccesses:       userAccesses,
		TeamAccesses:       teamAccesses,
		AdministratorsOnly: false,
		Public:             false,
		System:             false,
	}
}

// DecorateStacks will iterate through a list of stacks, check for an associated resource control for each
// stack and decorate the stack element if a resource control is found.
func DecorateStacks(stacks []portainer.Stack, resourceControls []portainer.ResourceControl) []portainer.Stack {
	for idx, stack := range stacks {

		resourceControl := GetResourceControlByResourceIDAndType(stack.Name, portainer.StackResourceControl, resourceControls)
		if resourceControl != nil {
			stacks[idx].ResourceControl = resourceControl
		}
	}

	return stacks
}

// FilterAuthorizedStacks returns a list of decorated stacks filtered through resource control access checks.
func FilterAuthorizedStacks(stacks []portainer.Stack, user *portainer.User, userTeamIDs []portainer.TeamID, rbacEnabled bool) []portainer.Stack {
	authorizedStacks := make([]portainer.Stack, 0)

	for _, stack := range stacks {
		_, ok := user.EndpointAuthorizations[stack.EndpointID][portainer.EndpointResourcesAccess]
		if rbacEnabled && ok {
			authorizedStacks = append(authorizedStacks, stack)
			continue
		}

		if stack.ResourceControl != nil && UserCanAccessResource(user.ID, userTeamIDs, stack.ResourceControl) {
			authorizedStacks = append(authorizedStacks, stack)
		}
	}

	return authorizedStacks
}

// UserCanAccessResource will valide that a user has permissions defined in the specified resource control
// based on its identifier and the team(s) he is part of.
func UserCanAccessResource(userID portainer.UserID, userTeamIDs []portainer.TeamID, resourceControl *portainer.ResourceControl) bool {
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

	return resourceControl.Public
}

// GetResourceControlByResourceIDAndType retrieves the first matching resource control in a set of resource controls
// based on the specified id and resource type parameters.
func GetResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType, resourceControls []portainer.ResourceControl) *portainer.ResourceControl {
	for _, resourceControl := range resourceControls {
		if resourceID == resourceControl.ResourceID && resourceType == resourceControl.Type {
			return &resourceControl
		}
		for _, subResourceID := range resourceControl.SubResourceIDs {
			if resourceID == subResourceID {
				return &resourceControl
			}
		}
	}
	return nil
}
