package source

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/stretchr/testify/require"
)

type vFn func(new *portainer.Source, old *portainer.Source, err error)

func testUAC(
	t *testing.T,
	userContext UserContext,
	new *portainer.Source,
	old *portainer.Source,
	validationFuncs ...vFn,
) {
	t.Helper()
	err := sanitizeAccesses(userContext, new, old)
	for _, validate := range validationFuncs {
		validate(new, old, err)
	}
}

func Test_SanitizeAccesses_Admin(t *testing.T) {
	errInvalidSource := func(_, _ *portainer.Source, err error) {
		t.Helper()
		require.ErrorIs(t, err, ErrInvalidSource)
	}

	noError := func(_, _ *portainer.Source, err error) { t.Helper(); require.NoError(t, err) }
	noOwner := func(new, _ *portainer.Source, _ error) { t.Helper(); require.Zero(t, new.OwnerID) }
	emptyUsers := func(new, _ *portainer.Source, _ error) { t.Helper(); require.Empty(t, new.UserAccesses) }
	emptyTeams := func(new, _ *portainer.Source, _ error) { t.Helper(); require.Empty(t, new.TeamAccesses) }
	public := func(v bool) func(new, _ *portainer.Source, _ error) {
		return func(new, _ *portainer.Source, _ error) { t.Helper(); require.Equal(t, v, new.Public) }
	}
	adminOnly := func(v bool) func(new, _ *portainer.Source, _ error) {
		return func(new, _ *portainer.Source, _ error) { t.Helper(); require.Equal(t, v, new.AdministratorsOnly) }
	}

	adminUserContext := NewUserContext(&portainer.User{Role: portainer.AdministratorRole}, []portainer.TeamMembership{})

	test := func(new *portainer.Source, old *portainer.Source, validationFuncs ...vFn) {
		t.Helper()
		testUAC(t, adminUserContext, new, old, validationFuncs...)
	}

	test(nil, nil, errInvalidSource)
	test(&portainer.Source{}, nil, noError)
	test(&portainer.Source{Git: &gittypes.GitSource{}}, nil,
		noError, emptyUsers, emptyTeams, adminOnly(true), noOwner, public(false),
	)
	test(&portainer.Source{Git: &gittypes.GitSource{}, Public: true}, nil,
		noError, emptyUsers, emptyTeams, adminOnly(false), noOwner, public(true),
	)
	test(&portainer.Source{Git: &gittypes.GitSource{}, AdministratorsOnly: true}, nil,
		noError, emptyUsers, emptyTeams, adminOnly(true), noOwner, public(false),
	)
	test(&portainer.Source{Git: &gittypes.GitSource{}, AdministratorsOnly: true, Public: true}, nil,
		noError, emptyUsers, emptyTeams, adminOnly(true), noOwner, public(false),
	)
	test(&portainer.Source{Git: &gittypes.GitSource{}, AdministratorsOnly: true, Public: true, UserAccesses: []portainer.UserID{1, 2}}, nil,
		noError, emptyUsers, emptyTeams, adminOnly(true), noOwner, public(false),
	)
}

// func Test_SanitizeAccesses_User(t *testing.T) {
// 	user := NewUserContext(&portainer.User{Role: portainer.StandardUserRole}, []portainer.TeamMembership{})
// }
