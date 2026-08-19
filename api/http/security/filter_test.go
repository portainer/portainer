package security

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func TestFilterEndpointsPanic(t *testing.T) {
	t.Parallel()
	endpoints := []portainer.Endpoint{{ID: 1}}
	groups := []portainer.EndpointGroup{}
	context := &RestrictedRequestContext{}

	FilterEndpoints(endpoints, groups, context)
}

func TestFilterUserTeams_MembershipOrderDiffersFromTeamOrder(t *testing.T) {
	t.Parallel()

	teams := []portainer.Team{{ID: 1, Name: "team1"}, {ID: 5, Name: "team5"}, {ID: 26, Name: "team26"}}
	context := &RestrictedRequestContext{
		UserID: 22,
		UserMemberships: []portainer.TeamMembership{
			{ID: 60, UserID: 22, TeamID: 26},
			{ID: 1, UserID: 22, TeamID: 1},
		},
	}

	filtered := FilterUserTeams(teams, context)

	require.Len(t, filtered, 2)
	require.ElementsMatch(t, []portainer.TeamID{1, 26}, []portainer.TeamID{filtered[0].ID, filtered[1].ID})
}

func TestLeaderTeamMembershipFilter_MatchesMembershipsOfLedTeams(t *testing.T) {
	t.Parallel()

	context := &RestrictedRequestContext{
		UserID: 22,
		UserMemberships: []portainer.TeamMembership{
			{ID: 1, UserID: 22, TeamID: 1, Role: portainer.TeamLeader},
			{ID: 2, UserID: 22, TeamID: 5, Role: 2},
		},
	}

	filter := LeaderTeamMembershipFilter(context)

	require.True(t, filter(portainer.TeamMembership{ID: 3, UserID: 99, TeamID: 1, Role: 2}))
	require.False(t, filter(portainer.TeamMembership{ID: 4, UserID: 22, TeamID: 5, Role: 2}))
}

func TestLeaderTeamMembershipFilter_NonLeaderMatchesNothing(t *testing.T) {
	t.Parallel()

	context := &RestrictedRequestContext{
		UserID:          22,
		UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 22, TeamID: 1, Role: 2}},
	}

	filter := LeaderTeamMembershipFilter(context)

	require.False(t, filter(portainer.TeamMembership{ID: 2, UserID: 22, TeamID: 1, Role: 2}))
}

func TestLeaderTeamMembershipFilter_IgnoresOtherUsersLeadership(t *testing.T) {
	t.Parallel()

	context := &RestrictedRequestContext{
		UserID:          22,
		UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 99, TeamID: 1, Role: portainer.TeamLeader}},
	}

	filter := LeaderTeamMembershipFilter(context)

	require.False(t, filter(portainer.TeamMembership{ID: 2, UserID: 22, TeamID: 1, Role: 2}))
}
