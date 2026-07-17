package source

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func Test_UserCanReadSource_AdministratorsOnly(t *testing.T) {
	standardUser := NewUserContext(&portainer.User{ID: 2, Role: portainer.StandardUserRole}, []portainer.TeamMembership{})
	teamMember := NewUserContext(&portainer.User{ID: 3, Role: portainer.StandardUserRole}, []portainer.TeamMembership{{TeamID: 7}})

	adminOnly := &portainer.Source{AdministratorsOnly: true}
	require.False(t, userCanReadSource(adminOnly, standardUser))

	// An explicit UserAccesses entry (the FindOrCreateGitSource auto-grant) wins
	// over AdministratorsOnly.
	granted := &portainer.Source{AdministratorsOnly: true, UserAccesses: []portainer.UserID{2}}
	require.True(t, userCanReadSource(granted, standardUser))
	require.False(t, userCanReadSource(granted, teamMember))

	// Team accesses do not override AdministratorsOnly — only user grants do.
	teamGranted := &portainer.Source{AdministratorsOnly: true, TeamAccesses: []portainer.TeamID{7}}
	require.False(t, userCanReadSource(teamGranted, teamMember))
}
