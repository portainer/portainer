package portainer

type (
	// DecoratedStack represents a stack combined with its associated access control
	DecoratedStack struct {
		Stack
		ResourceControl ResourceControl `json:"ResourceControl"`
	}
)

// NewPrivateResourceControl will create a new private resource control associated to the resource specified by the
// identifier and type parameters. It automatically assigns it to the user specified by the userID parameter.
func NewPrivateResourceControl(resourceIdentifier string, resourceType ResourceControlType, userID UserID) (*ResourceControl, error) {

	resourceControl := &ResourceControl{
		AdministratorsOnly: false,
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		SubResourceIDs:     []string{},
		UserAccesses: []UserResourceAccess{
			{
				UserID:      userID,
				AccessLevel: ReadWriteAccessLevel,
			},
		},
		TeamAccesses: []TeamResourceAccess{},
	}

	return resourceControl, nil
}

// CanAccessStack checks if a user can access a stack
func CanAccessStack(stack *Stack, resourceControl *ResourceControl, userID UserID, memberships []TeamMembership) bool {
	if resourceControl == nil {
		return false
	}

	userTeamIDs := make([]TeamID, 0)
	for _, membership := range memberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	if CanUserAccessResource(userID, userTeamIDs, resourceControl) {
		return true
	}

	return resourceControl.Public
}

func CanUserAccessResource(userID UserID, userTeamIDs []TeamID, resourceControl *ResourceControl) bool {
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

// FilterStacks filters stacks based on user role and resource controls.
func FilterStacks(stacks []Stack, resourceControls []ResourceControl, isAdmin bool,
	userID UserID, memberships []TeamMembership) []DecoratedStack {

	filteredStacks := make([]DecoratedStack, 0)

	userTeamIDs := make([]TeamID, 0)
	for _, membership := range memberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	for _, stack := range stacks {
		extendedStack := DecoratedStack{stack, ResourceControl{}}
		resourceControl := GetResourceControlByResourceIDAndType(stack.Name, StackResourceControl, resourceControls)
		if resourceControl == nil && isAdmin {
			filteredStacks = append(filteredStacks, extendedStack)
		} else if resourceControl != nil && (isAdmin || resourceControl.Public || CanUserAccessResource(userID, userTeamIDs, resourceControl)) {
			extendedStack.ResourceControl = *resourceControl
			filteredStacks = append(filteredStacks, extendedStack)
		}
	}

	return filteredStacks
}

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
