package authorization

import (
	portainer "github.com/portainer/portainer/api"
)

// ResolvedAccess represents the result of dynamic authorization resolution.
// It contains both the computed role and its authorizations for convenience.
type ResolvedAccess struct {
	Role           *portainer.Role
	Authorizations portainer.Authorizations
	Source         AccessSource
}

// AccessSource captures which layers contributed to a resolved access decision.
//
//   - GroupID is set when access was granted via the user-group or team-group
//     layer, OR (in EE) via a policy targeting the environment group.
//   - TeamID  is set when access was granted via either of the team layers; the
//     ID of the team whose membership matched.
type AccessSource struct {
	GroupID portainer.EndpointGroupID
	TeamID  portainer.TeamID
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

// ResolveUserEndpointAccess resolves a user's effective access to an endpoint.
// It checks access in precedence order:
//  1. User → Endpoint direct access
//  2. User → Endpoint Group access (inherited)
//  3. User's Teams → Endpoint access
//  4. User's Teams → Endpoint Group access (inherited)
func ResolveUserEndpointAccess(input ResolverInput) *ResolvedAccess {
	group := input.EndpointGroup

	// 1. Check user → endpoint direct access
	if role := GetRoleFromUserAccessPolicies(
		input.User.ID,
		input.Endpoint.UserAccessPolicies,
		input.Roles,
	); role != nil {
		return &ResolvedAccess{
			Role:           role,
			Authorizations: role.Authorizations,
		}
	}

	// 2. Check user → endpoint group access (inherited)
	if role := GetRoleFromUserAccessPolicies(
		input.User.ID,
		group.UserAccessPolicies,
		input.Roles,
	); role != nil {
		return &ResolvedAccess{
			Role:           role,
			Authorizations: role.Authorizations,
			Source:         AccessSource{GroupID: group.ID},
		}
	}

	// 3. Check user's teams → endpoint access
	if role, teamID := getTeamRoleWithSource(
		input.UserMemberships,
		input.Endpoint.TeamAccessPolicies,
		input.Roles,
	); role != nil {
		return &ResolvedAccess{
			Role:           role,
			Authorizations: role.Authorizations,
			Source:         AccessSource{TeamID: teamID},
		}
	}

	// 4. Check user's teams → endpoint group access (inherited)
	if role, teamID := getTeamRoleWithSource(
		input.UserMemberships,
		group.TeamAccessPolicies,
		input.Roles,
	); role != nil {
		return &ResolvedAccess{
			Role:           role,
			Authorizations: role.Authorizations,
			Source:         AccessSource{GroupID: group.ID, TeamID: teamID},
		}
	}

	return nil
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
	role, _ := getTeamRoleWithSource(memberships, policies, roles)
	return role
}

// getTeamRoleWithSource is GetRoleFromTeamAccessPolicies plus the matching team ID.
func getTeamRoleWithSource(
	memberships []portainer.TeamMembership,
	policies portainer.TeamAccessPolicies,
	roles []portainer.Role,
) (*portainer.Role, portainer.TeamID) {
	if policies == nil || len(memberships) == 0 {
		return nil, 0
	}

	var (
		best       *portainer.Role
		bestTeamID portainer.TeamID
	)
	for _, membership := range memberships {
		policy, ok := policies[membership.TeamID]
		if !ok {
			continue
		}

		role := FindRoleByID(policy.RoleID, roles)
		if role == nil {
			continue
		}

		if best == nil || role.Priority > best.Priority {
			best = role
			bestTeamID = membership.TeamID
		}
	}
	return best, bestTeamID
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
