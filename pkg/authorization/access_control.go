package authorization

import (
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/slicesx"
)

// NewAdministratorsOnlyResourceControl will create a new administrators only resource control associated to the resource specified by the
// identifier and type parameters
func NewAdministratorsOnlyResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType) *portainer.ResourceControl {
	return &portainer.ResourceControl{
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		SubResourceIDs:     []string{},
		UserAccesses:       []portainer.UserResourceAccess{},
		TeamAccesses:       []portainer.TeamResourceAccess{},
		AdministratorsOnly: true,
		Public:             false,
		System:             false,
	}
}

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

// NewSystemResourceControl creates a new public resource control with the System flag set to true.
// These resource controls are not persisted and are created on the fly by the Portainer API.
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

// NewPublicResourceControl creates a new public resource control.
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

// NewRestrictedResourceControl creates a new resource control with user and team access restrictions.
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

// UserCanAccessResource validates that a user has permissions defined in the specified resource control
// based on their identifier and the team(s) they belong to.
func UserCanAccessResource(userID portainer.UserID, userTeamIDs []portainer.TeamID, resourceControl *portainer.ResourceControl) bool {
	if resourceControl == nil {
		return false
	}

	for _, authorizedUserAccess := range resourceControl.UserAccesses {
		if userID == authorizedUserAccess.UserID {
			return true
		}
	}

	for _, authorizedTeamAccess := range resourceControl.TeamAccesses {
		if slices.Contains(userTeamIDs, authorizedTeamAccess.TeamID) {
			return true
		}
	}

	return resourceControl.Public
}

// GetResourceControlByResourceIDAndType retrieves the first matching resource control in a set of resource controls
// based on the specified id and resource type parameters.
func GetResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType, resourceControls []portainer.ResourceControl) *portainer.ResourceControl {
	for i := range resourceControls {
		if resourceID == resourceControls[i].ResourceID && resourceType == resourceControls[i].Type {
			return &resourceControls[i]
		}

		if slices.Contains(resourceControls[i].SubResourceIDs, resourceID) {
			return &resourceControls[i]
		}
	}

	return nil
}

// TeamIDs extracts the TeamID from each membership.
func TeamIDs(memberships []portainer.TeamMembership) []portainer.TeamID {
	return slicesx.Map(memberships, func(m portainer.TeamMembership) portainer.TeamID {
		return m.TeamID
	})
}
