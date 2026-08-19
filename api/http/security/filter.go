package security

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/set"
	"github.com/portainer/portainer/api/slicesx"
)

// FilterUserTeams filters teams based on user role.
// non-administrator users only have access to team they are member of.
func FilterUserTeams(teams []portainer.Team, context *RestrictedRequestContext) []portainer.Team {
	if context.IsAdmin {
		return teams
	}

	memberOf := map[portainer.TeamID]bool{}
	for _, membership := range context.UserMemberships {
		memberOf[membership.TeamID] = true
	}

	return slicesx.FilterInPlace(teams, func(team portainer.Team) bool {
		return memberOf[team.ID]
	})
}

// FilterLeaderTeams filters teams based on user role.
// Team leaders only have access to team they lead.
func FilterLeaderTeams(teams []portainer.Team, context *RestrictedRequestContext) []portainer.Team {
	if !context.IsTeamLeader {
		return teams[:0]
	}

	leaderSet := map[portainer.TeamID]bool{}
	for _, membership := range context.UserMemberships {
		if membership.Role == portainer.TeamLeader && membership.UserID == context.UserID {
			leaderSet[membership.TeamID] = true
		}
	}

	return slicesx.FilterInPlace(teams, func(team portainer.Team) bool {
		return leaderSet[team.ID]
	})
}

// LeaderTeamMembershipFilter returns a predicate matching team memberships that
// belong to teams the caller leads, for use with TeamMembershipService.ReadAll.
func LeaderTeamMembershipFilter(context *RestrictedRequestContext) func(portainer.TeamMembership) bool {
	leaderSet := set.Set[portainer.TeamID]{}
	for _, membership := range context.UserMemberships {
		if membership.Role == portainer.TeamLeader && membership.UserID == context.UserID {
			leaderSet.Add(membership.TeamID)
		}
	}

	return func(membership portainer.TeamMembership) bool {
		return leaderSet.Contains(membership.TeamID)
	}
}

// FilterUsers filters users based on user role.
// Non-administrator users only have access to non-administrator users.
func FilterUsers(users []portainer.User, context *RestrictedRequestContext) []portainer.User {
	if context.IsAdmin {
		return users
	}

	return slicesx.FilterInPlace(users, func(u portainer.User) bool {
		return u.Role != portainer.AdministratorRole
	})
}

// FilterRegistries filters registries based on user role and team memberships.
// Non administrator users only have access to authorized registries.
func FilterRegistries(registries []portainer.Registry, user *portainer.User, teamMemberships []portainer.TeamMembership, endpointID portainer.EndpointID) []portainer.Registry {
	if user.Role == portainer.AdministratorRole {
		return registries
	}

	return slicesx.FilterInPlace(registries, func(r portainer.Registry) bool {
		return AuthorizedRegistryAccess(&r, user, teamMemberships, endpointID)
	})
}

// FilterEndpoints filters environments(endpoints) based on user role and team memberships.
// Non administrator only have access to authorized environments(endpoints) (can be inherited via endpoint groups).
func FilterEndpoints(endpoints []portainer.Endpoint, groups []portainer.EndpointGroup, context *RestrictedRequestContext) []portainer.Endpoint {
	if context.IsAdmin {
		return endpoints
	}

	n := 0
	for _, endpoint := range endpoints {
		endpointGroup := getAssociatedGroup(&endpoint, groups)
		if endpointGroup == nil {
			continue
		}

		if AuthorizedEndpointAccess(&endpoint, endpointGroup, context.UserID, context.UserMemberships) {
			endpoint.UserAccessPolicies = nil
			endpoints[n] = endpoint
			n++
		}
	}

	return endpoints[:n]
}

// FilterEndpointGroups filters environment(endpoint) groups based on user role and team memberships.
// Non administrator users only have access to authorized environment(endpoint) groups.
func FilterEndpointGroups(endpointGroups []portainer.EndpointGroup, context *RestrictedRequestContext) []portainer.EndpointGroup {
	if context.IsAdmin {
		return endpointGroups
	}

	return slicesx.FilterInPlace(endpointGroups, func(group portainer.EndpointGroup) bool {
		return authorizedEndpointGroupAccess(&group, context.UserID, context.UserMemberships)
	})
}

func getAssociatedGroup(endpoint *portainer.Endpoint, groups []portainer.EndpointGroup) *portainer.EndpointGroup {
	for _, group := range groups {
		if group.ID == endpoint.GroupID {
			return &group
		}
	}

	return nil
}
