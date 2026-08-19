package teammemberships

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestTeamMembershipList_adminGetsAllMemberships(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	require.NoError(t, store.TeamMembershipService.Create(&portainer.TeamMembership{UserID: 1, TeamID: 1, Role: portainer.TeamLeader}))
	require.NoError(t, store.TeamMembershipService.Create(&portainer.TeamMembership{UserID: 2, TeamID: 2, Role: portainer.TeamMember}))

	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	rr := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/team_memberships", nil)

	restrictedCtx := &security.RestrictedRequestContext{IsAdmin: true}
	r = r.WithContext(security.StoreRestrictedRequestContext(r, restrictedCtx))

	h.ServeHTTP(rr, r)

	require.Equal(t, http.StatusOK, rr.Code)

	var memberships []portainer.TeamMembership
	err := json.Unmarshal(rr.Body.Bytes(), &memberships)
	require.NoError(t, err)
	require.Len(t, memberships, 2)
}

func TestTeamMembershipList_leaderOnlySeesOwnLedTeam(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	require.NoError(t, store.TeamMembershipService.Create(&portainer.TeamMembership{UserID: 1, TeamID: 1, Role: portainer.TeamLeader}))
	require.NoError(t, store.TeamMembershipService.Create(&portainer.TeamMembership{UserID: 2, TeamID: 2, Role: portainer.TeamLeader}))
	require.NoError(t, store.TeamMembershipService.Create(&portainer.TeamMembership{UserID: 3, TeamID: 2, Role: portainer.TeamMember}))

	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	rr := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/team_memberships", nil)

	restrictedCtx := &security.RestrictedRequestContext{
		IsAdmin:      false,
		IsTeamLeader: true,
		UserID:       1,
		UserMemberships: []portainer.TeamMembership{
			{UserID: 1, TeamID: 1, Role: portainer.TeamLeader},
		},
	}
	r = r.WithContext(security.StoreRestrictedRequestContext(r, restrictedCtx))

	h.ServeHTTP(rr, r)

	require.Equal(t, http.StatusOK, rr.Code)

	var memberships []portainer.TeamMembership
	err := json.Unmarshal(rr.Body.Bytes(), &memberships)
	require.NoError(t, err)
	require.Len(t, memberships, 1)
	require.Equal(t, portainer.TeamID(1), memberships[0].TeamID)
}
