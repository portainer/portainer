package teammemberships

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestUpdate(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	err := store.TeamMembershipService.Create(&portainer.TeamMembership{
		UserID: 3,
		TeamID: 3,
		Role:   1,
	})
	require.NoError(t, err)

	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	payload := `{"UserID": 3, "TeamID": 2, "Role": 1}`

	rr := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPut, "/team_memberships/1", strings.NewReader(payload))

	restrictedCtx := &security.RestrictedRequestContext{IsAdmin: true}
	r = r.WithContext(security.StoreRestrictedRequestContext(r, restrictedCtx))

	h.ServeHTTP(rr, r)

	require.Equal(t, http.StatusOK, rr.Code)

	var updatedMembership portainer.TeamMembership
	err = json.Unmarshal(rr.Body.Bytes(), &updatedMembership)
	require.NoError(t, err)

	require.Equal(t, portainer.UserID(3), updatedMembership.UserID)
	require.Equal(t, portainer.TeamID(2), updatedMembership.TeamID)
	require.Equal(t, portainer.MembershipRole(1), updatedMembership.Role)
}

func TestUpdate_leaderCannotChangeOwnMembership(t *testing.T) {
	t.Parallel()

	const (
		leaderID = portainer.UserID(3)
		memberID = portainer.UserID(4)
		teamID   = portainer.TeamID(1)
	)

	_, store := datastore.MustNewTestStore(t, false, false)

	leaderMembership := &portainer.TeamMembership{UserID: leaderID, TeamID: teamID, Role: portainer.TeamLeader}
	require.NoError(t, store.TeamMembershipService.Create(leaderMembership))
	memberMembership := &portainer.TeamMembership{UserID: memberID, TeamID: teamID, Role: portainer.TeamMember}
	require.NoError(t, store.TeamMembershipService.Create(memberMembership))

	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	leaderContext := &security.RestrictedRequestContext{
		IsTeamLeader:    true,
		UserID:          leaderID,
		UserMemberships: []portainer.TeamMembership{*leaderMembership},
	}

	updateAsLeader := func(membershipID portainer.TeamMembershipID, payload string) int {
		rr := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPut, "/team_memberships/"+strconv.Itoa(int(membershipID)), strings.NewReader(payload))
		r = r.WithContext(security.StoreTokenData(r, &portainer.TokenData{ID: leaderID, Role: portainer.StandardUserRole}))
		r = r.WithContext(security.StoreRestrictedRequestContext(r, leaderContext))
		h.ServeHTTP(rr, r)

		return rr.Code
	}

	require.Equal(t, http.StatusForbidden, updateAsLeader(leaderMembership.ID, `{"UserID": 3, "TeamID": 1, "Role": 2}`))
	stored, err := store.TeamMembership().Read(leaderMembership.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.TeamLeader, stored.Role, "the leader must not be able to demote themselves")

	require.Equal(t, http.StatusOK, updateAsLeader(memberMembership.ID, `{"UserID": 4, "TeamID": 1, "Role": 1}`))
}
