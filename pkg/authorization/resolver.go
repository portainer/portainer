package authorization

import (
	portainer "github.com/portainer/portainer/api"
)

// ResolvedAccess represents the result of dynamic authorization resolution.
// It contains both the computed role and its authorizations for convenience.
type ResolvedAccess struct {
	Role           *portainer.Role
	Authorizations portainer.Authorizations
}

// ResolverInput contains all the data needed to resolve user access to an endpoint.
// This struct is used to pass data to the resolution functions without requiring
// database access, making it easier to test and allowing callers to control data fetching.
type ResolverInput struct {
	User            *portainer.User
	Endpoint        *portainer.Endpoint
	EndpointGroup   portainer.EndpointGroup
	UserMemberships []portainer.TeamMembership
	Roles           []portainer.Role
}

// ComputeBaseRole computes the user's role on an endpoint from base access settings.
// It checks access in precedence order:
//  1. User → Endpoint direct access
//  2. User → Endpoint Group access (inherited)
//  3. User's Teams → Endpoint access
//  4. User's Teams → Endpoint Group access (inherited)
//
// Returns the first matching role, or nil if no access is configured.
func ComputeBaseRole(input ResolverInput) *portainer.Role {
	group := input.EndpointGroup

	// 1. Check user → endpoint direct access
	if role := GetRoleFromUserAccessPolicies(
		input.User.ID,
		input.Endpoint.UserAccessPolicies,
		input.Roles,
	); role != nil {
		return role
	}

	// 2. Check user → endpoint group access (inherited)
	if role := GetRoleFromUserAccessPolicies(
		input.User.ID,
		group.UserAccessPolicies,
		input.Roles,
	); role != nil {
		return role
	}

	// 3. Check user's teams → endpoint access
	if role := GetRoleFromTeamAccessPolicies(
		input.UserMemberships,
		input.Endpoint.TeamAccessPolicies,
		input.Roles,
	); role != nil {
		return role
	}

	// 4. Check user's teams → endpoint group access (inherited)
	if role := GetRoleFromTeamAccessPolicies(
		input.UserMemberships,
		group.TeamAccessPolicies,
		input.Roles,
	); role != nil {
		return role
	}

	return nil
}

// ResolveUserEndpointAccess resolves a user's effective access to an endpoint.
// In CE, this returns the base role computed from endpoint/group access settings.
// EE extends this to also consider applied RBAC policies.
//
// Returns nil if the user has no access to the endpoint.
func ResolveUserEndpointAccess(input ResolverInput) *ResolvedAccess {
	role := ComputeBaseRole(input)
	if role == nil {
		return nil
	}

	return &ResolvedAccess{
		Role:           role,
		Authorizations: role.Authorizations,
	}
}

// GetRoleFromUserAccessPolicies returns the role for a user from user access policies.
// Returns nil if the user is not in the policies.
func GetRoleFromUserAccessPolicies(
	userID portainer.UserID,
	policies portainer.UserAccessPolicies,
	roles []portainer.Role,
) *portainer.Role {
	if policies == nil {
		return nil
	}

	policy, ok := policies[userID]
	if !ok {
		return nil
	}

	return FindRoleByID(policy.RoleID, roles)
}

// GetRoleFromTeamAccessPolicies returns the highest priority role for a user
// based on their team memberships and the team access policies.
// If a user belongs to multiple teams with access, the role with highest priority wins.
// Returns nil if none of the user's teams have access.
func GetRoleFromTeamAccessPolicies(
	memberships []portainer.TeamMembership,
	policies portainer.TeamAccessPolicies,
	roles []portainer.Role,
) *portainer.Role {
	if policies == nil || len(memberships) == 0 {
		return nil
	}

	// Collect all roles from team memberships
	var matchingRoles []*portainer.Role
	for _, membership := range memberships {
		policy, ok := policies[membership.TeamID]
		if !ok {
			continue
		}

		role := FindRoleByID(policy.RoleID, roles)
		if role != nil {
			matchingRoles = append(matchingRoles, role)
		}
	}

	if len(matchingRoles) == 0 {
		return nil
	}

	// Return the role with highest priority
	return GetHighestPriorityRole(matchingRoles)
}

// GetHighestPriorityRole returns the role with the highest priority from a slice.
// In Portainer's role system, higher priority numbers = higher priority (lower access usually gives higher priority).
// Current role priorities from highest to lowest: Read-only User (6), Standard User (5),
// Namespace Operator (4), Helpdesk (3), Operator (2), Environment Administrator (1).
// Returns nil if the slice is empty.
func GetHighestPriorityRole(roles []*portainer.Role) *portainer.Role {
	if len(roles) == 0 {
		return nil
	}

	highest := roles[0]
	for _, role := range roles[1:] {
		if role.Priority > highest.Priority {
			highest = role
		}
	}

	return highest
}

// FindRoleByID finds a role by its ID in a slice of roles.
// Returns nil if the role is not found.
func FindRoleByID(roleID portainer.RoleID, roles []portainer.Role) *portainer.Role {
	for i := range roles {
		if roles[i].ID == roleID {
			return &roles[i]
		}
	}
	return nil
}
