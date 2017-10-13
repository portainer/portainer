package proxy

import "github.com/portainer/portainer"

// TODO: REFACTOR

type (
	ExtendedStack struct {
		portainer.Stack
		ResourceControl portainer.ResourceControl `json:"ResourceControl"`
	}
)

func CanAccessStack(stack *portainer.Stack, resourceControl *portainer.ResourceControl, userID portainer.UserID, memberships []portainer.TeamMembership) bool {
	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range memberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	if canUserAccessResource(userID, userTeamIDs, resourceControl) {
		return true
	}

	return false
}

// FilterStacks filters stacks based on user role and resource controls.
func FilterStacks(stacks []portainer.Stack, resourceControls []portainer.ResourceControl, userID portainer.UserID, memberships []portainer.TeamMembership) []ExtendedStack {
	filteredStacks := make([]ExtendedStack, 0)

	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range memberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	for _, stack := range stacks {
		extendedStack := ExtendedStack{stack, portainer.ResourceControl{}}
		resourceControl := getResourceControlByResourceID(stack.Name, resourceControls)
		if resourceControl == nil {
			filteredStacks = append(filteredStacks, extendedStack)
		} else if resourceControl != nil && canUserAccessResource(userID, userTeamIDs, resourceControl) {
			// volumeObject = decorateObject(volumeObject, resourceControl)
			extendedStack.ResourceControl = *resourceControl
			filteredStacks = append(filteredStacks, extendedStack)
		}
	}

	return filteredStacks
}

// DecorateStacks decorates all the stacks objects with resoure controls.
func DecorateStacks(stacks []portainer.Stack, resourceControls []portainer.ResourceControl, userID portainer.UserID, memberships []portainer.TeamMembership) []ExtendedStack {
	decoratedStacks := make([]ExtendedStack, 0)

	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range memberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	for _, stack := range stacks {
		extendedStack := ExtendedStack{stack, portainer.ResourceControl{}}

		resourceControl := getResourceControlByResourceID(stack.Name, resourceControls)
		if resourceControl != nil {
			extendedStack.ResourceControl = *resourceControl
		}
		decoratedStacks = append(decoratedStacks, extendedStack)
	}

	return decoratedStacks
}
