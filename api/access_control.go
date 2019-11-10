package portainer

// NewPrivateResourceControl will create a new private resource control associated to the resource specified by the
// identifier and type parameters. It automatically assigns it to the user specified by the userID parameter.
func NewPrivateResourceControl(resourceIdentifier string, resourceType ResourceControlType, userID UserID) *ResourceControl {
	return &ResourceControl{
		Type:           resourceType,
		ResourceID:     resourceIdentifier,
		SubResourceIDs: []string{},
		UserAccesses: []UserResourceAccess{
			{
				UserID:      userID,
				AccessLevel: ReadWriteAccessLevel,
			},
		},
		TeamAccesses:       []TeamResourceAccess{},
		AdministratorsOnly: false,
		Public:             false,
		System:             false,
	}
}

// NewSystemResourceControl will create a new public resource control with the System flag set to true.
// These kind of resource control are not persisted and are created on the fly by the Portainer API.
func NewSystemResourceControl(resourceIdentifier string, resourceType ResourceControlType) *ResourceControl {
	return &ResourceControl{
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		SubResourceIDs:     []string{},
		UserAccesses:       []UserResourceAccess{},
		TeamAccesses:       []TeamResourceAccess{},
		AdministratorsOnly: false,
		Public:             true,
		System:             true,
	}
}

// NewPublicResourceControl will create a new public resource control.
func NewPublicResourceControl(resourceIdentifier string, resourceType ResourceControlType) *ResourceControl {
	return &ResourceControl{
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		SubResourceIDs:     []string{},
		UserAccesses:       []UserResourceAccess{},
		TeamAccesses:       []TeamResourceAccess{},
		AdministratorsOnly: false,
		Public:             true,
		System:             false,
	}
}

// NewRestrictedResourceControl will create a new resource control with user and team accesses restrictions.
func NewRestrictedResourceControl(resourceIdentifier string, resourceType ResourceControlType, userIDs []UserID, teamIDs []TeamID) *ResourceControl {
	userAccesses := make([]UserResourceAccess, 0)
	teamAccesses := make([]TeamResourceAccess, 0)

	for _, id := range userIDs {
		access := UserResourceAccess{
			UserID:      id,
			AccessLevel: ReadWriteAccessLevel,
		}

		userAccesses = append(userAccesses, access)
	}

	for _, id := range teamIDs {
		access := TeamResourceAccess{
			TeamID:      id,
			AccessLevel: ReadWriteAccessLevel,
		}

		teamAccesses = append(teamAccesses, access)
	}

	return &ResourceControl{
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
func DecorateStacks(stacks []Stack, resourceControls []ResourceControl) []Stack {
	for idx, stack := range stacks {

		resourceControl := GetResourceControlByResourceIDAndType(stack.Name, StackResourceControl, resourceControls)
		if resourceControl != nil {
			stacks[idx].ResourceControl = resourceControl
		}
	}

	return stacks
}

// FilterAuthorizedStacks returns a list of decorated stacks filtered through resource control access checks.
func FilterAuthorizedStacks(stacks []Stack, user *User, userTeamIDs []TeamID, rbacEnabled bool) []Stack {
	authorizedStacks := make([]Stack, 0)

	for _, stack := range stacks {
		_, ok := user.EndpointAuthorizations[stack.EndpointID][EndpointResourcesAccess]
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
func UserCanAccessResource(userID UserID, userTeamIDs []TeamID, resourceControl *ResourceControl) bool {
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
func GetResourceControlByResourceIDAndType(resourceID string, resourceType ResourceControlType, resourceControls []ResourceControl) *ResourceControl {
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
