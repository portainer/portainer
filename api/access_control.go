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

func DecorateStacks(stacks []Stack, resourceControls []ResourceControl) []DecoratedStack {
	decoratedStacks := make([]DecoratedStack, 0)

	for _, stack := range stacks {
		decoratedStack := DecoratedStack{
			Stack: stack,
		}

		resourceControl := GetResourceControlByResourceIDAndType(stack.Name, StackResourceControl, resourceControls)
		if resourceControl != nil {
			decoratedStack.ResourceControl = *resourceControl
		}

		decoratedStacks = append(decoratedStacks, decoratedStack)
	}

	return decoratedStacks
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

// FilterAuthorizedStacks returns a list of decorated stacks filtered through resource control access checks.
func FilterAuthorizedStacks(stacks []DecoratedStack, userID UserID, userTeamIDs []TeamID) []DecoratedStack {
	authorizedStacks := make([]DecoratedStack, 0)

	for _, stack := range stacks {

		if UserCanAccessResource(userID, userTeamIDs, &stack.ResourceControl) {
			authorizedStacks = append(authorizedStacks, stack)
		}

	}

	return authorizedStacks
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
