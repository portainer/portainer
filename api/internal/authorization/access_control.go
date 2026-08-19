package authorization

import (
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/portainer/portainer/pkg/authorization"
)

var (
	NewAdministratorsOnlyResourceControl  = authorization.NewAdministratorsOnlyResourceControl
	NewPrivateResourceControl             = authorization.NewPrivateResourceControl
	NewSystemResourceControl              = authorization.NewSystemResourceControl
	NewPublicResourceControl              = authorization.NewPublicResourceControl
	NewRestrictedResourceControl          = authorization.NewRestrictedResourceControl
	UserCanAccessResource                 = authorization.UserCanAccessResource
	GetResourceControlByResourceIDAndType = authorization.GetResourceControlByResourceIDAndType
	TeamIDs                               = authorization.TeamIDs
)

func NewEmptyRestrictedResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType) *portainer.ResourceControl {
	return NewRestrictedResourceControl(resourceIdentifier, resourceType, []portainer.UserID{}, []portainer.TeamID{})
}

// DecorateStacks will iterate through a list of stacks, check for an associated resource control for each
// stack and decorate the stack element if a resource control is found.
func DecorateStacks(stacks []portainer.Stack, resourceControls []portainer.ResourceControl) []portainer.Stack {
	for idx, stack := range stacks {
		resourceControl := GetResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl, resourceControls)
		if resourceControl != nil {
			stacks[idx].ResourceControl = resourceControl
		}
	}

	return stacks
}

// DecorateCustomTemplates will iterate through a list of custom templates, check for an associated resource control for each
// template and decorate the template element if a resource control is found.
func DecorateCustomTemplates(templates []portainer.CustomTemplate, resourceControls []portainer.ResourceControl) []portainer.CustomTemplate {
	for idx, template := range templates {
		resourceControl := GetResourceControlByResourceIDAndType(strconv.Itoa(int(template.ID)), portainer.CustomTemplateResourceControl, resourceControls)
		if resourceControl != nil {
			templates[idx].ResourceControl = resourceControl
		}
	}

	return templates
}

// FilterAuthorizedStacks returns a list of decorated stacks filtered through resource control access checks.
func FilterAuthorizedStacks(stacks []portainer.Stack, userID portainer.UserID, userTeamIDs []portainer.TeamID) []portainer.Stack {
	authorizedStacks := make([]portainer.Stack, 0)

	for _, stack := range stacks {
		if stack.ResourceControl != nil && UserCanAccessResource(userID, userTeamIDs, stack.ResourceControl) {
			authorizedStacks = append(authorizedStacks, stack)
		}
	}

	return authorizedStacks
}

// FilterAuthorizedCustomTemplates returns a list of decorated custom templates filtered through resource control access checks.
func FilterAuthorizedCustomTemplates(customTemplates []portainer.CustomTemplate, user *portainer.User, userTeamIDs []portainer.TeamID) []portainer.CustomTemplate {
	authorizedTemplates := make([]portainer.CustomTemplate, 0)

	for _, customTemplate := range customTemplates {
		if customTemplate.CreatedByUserID == user.ID || (customTemplate.ResourceControl != nil && UserCanAccessResource(user.ID, userTeamIDs, customTemplate.ResourceControl)) {
			authorizedTemplates = append(authorizedTemplates, customTemplate)
		}
	}

	return authorizedTemplates
}
