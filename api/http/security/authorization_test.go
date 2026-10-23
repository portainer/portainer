package security

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

func TestAuthorizedResourceControlUpdate_AdminAlwaysAllowed(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		AdministratorsOnly: true,
	}
	ctx := &RestrictedRequestContext{IsAdmin: true}

	require.True(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_PublicAlwaysAllowed(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		Public: true,
	}
	ctx := &RestrictedRequestContext{IsAdmin: false}

	require.True(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_AdministratorsOnlyDenied(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		AdministratorsOnly: true,
		UserAccesses: []portainer.UserResourceAccess{
			{UserID: 1, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}
	ctx := &RestrictedRequestContext{IsAdmin: false, UserID: 1}

	require.False(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_EmptyAccessesDenied(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{}
	ctx := &RestrictedRequestContext{IsAdmin: false, UserID: 1}

	require.False(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_UserAccessMatchingCurrentUser(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		UserAccesses: []portainer.UserResourceAccess{
			{UserID: 1, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}
	ctx := &RestrictedRequestContext{IsAdmin: false, UserID: 1}

	require.True(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_UserAccessNotMatchingCurrentUser(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		UserAccesses: []portainer.UserResourceAccess{
			{UserID: 2, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}
	ctx := &RestrictedRequestContext{IsAdmin: false, UserID: 1}

	require.False(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_TeamAccessUserMemberOfAllTeams(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		TeamAccesses: []portainer.TeamResourceAccess{
			{TeamID: 1, AccessLevel: portainer.ReadWriteAccessLevel},
			{TeamID: 2, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}
	ctx := &RestrictedRequestContext{
		IsAdmin: false,
		UserMemberships: []portainer.TeamMembership{
			{TeamID: 1},
			{TeamID: 2},
		},
	}

	require.True(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_TeamAccessUserNotMemberOfAllTeams(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		TeamAccesses: []portainer.TeamResourceAccess{
			{TeamID: 1, AccessLevel: portainer.ReadWriteAccessLevel},
			{TeamID: 3, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}
	ctx := &RestrictedRequestContext{
		IsAdmin: false,
		UserMemberships: []portainer.TeamMembership{
			{TeamID: 1},
			{TeamID: 2},
		},
	}

	require.False(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_TeamAccessUserNotMemberOfAnyTeam(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		TeamAccesses: []portainer.TeamResourceAccess{
			{TeamID: 5, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}
	ctx := &RestrictedRequestContext{
		IsAdmin: false,
		UserMemberships: []portainer.TeamMembership{
			{TeamID: 1},
		},
	}

	require.False(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_MultipleUserAccessesDenied(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		UserAccesses: []portainer.UserResourceAccess{
			{UserID: 1, AccessLevel: portainer.ReadWriteAccessLevel},
			{UserID: 2, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}
	ctx := &RestrictedRequestContext{IsAdmin: false, UserID: 1}

	require.False(t, AuthorizedResourceControlUpdate(rc, ctx))
}

func TestAuthorizedResourceControlUpdate_UserAndTeamAccessCombinationDenied(t *testing.T) {
	t.Parallel()

	rc := &portainer.ResourceControl{
		UserAccesses: []portainer.UserResourceAccess{
			{UserID: 1, AccessLevel: portainer.ReadWriteAccessLevel},
		},
		TeamAccesses: []portainer.TeamResourceAccess{
			{TeamID: 1, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}
	ctx := &RestrictedRequestContext{
		IsAdmin: false,
		UserID:  1,
		UserMemberships: []portainer.TeamMembership{
			{TeamID: 1},
		},
	}

	require.False(t, AuthorizedResourceControlUpdate(rc, ctx))
}
