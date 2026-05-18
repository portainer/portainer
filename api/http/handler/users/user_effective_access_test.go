package users

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_userEffectiveAccess(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	const (
		standardRoleID portainer.RoleID = 1
		helpdeskRoleID portainer.RoleID = 2
		teamID         portainer.TeamID = 100
		groupID                         = portainer.EndpointGroupID(10)
		envID                           = portainer.EndpointID(200)
	)

	require.NoError(t, store.Role().Create(&portainer.Role{ID: standardRoleID, Name: "Standard user", Priority: 1}))
	require.NoError(t, store.Role().Create(&portainer.Role{ID: helpdeskRoleID, Name: "Helpdesk", Priority: 5}))

	require.NoError(t, store.EndpointGroup().Create(&portainer.EndpointGroup{ID: groupID, Name: "production"}))
	require.NoError(t, store.Team().Create(&portainer.Team{ID: teamID, Name: "devs"}))

	adminUser := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(adminUser))

	targetUser := &portainer.User{ID: 2, Username: "alice", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(targetUser))

	otherUser := &portainer.User{ID: 3, Username: "bob", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(otherUser))

	require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{ID: 1, UserID: targetUser.ID, TeamID: teamID, Role: portainer.TeamMember}))

	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
		ID:                 envID,
		Name:               "env-1",
		GroupID:            groupID,
		UserAccessPolicies: portainer.UserAccessPolicies{targetUser.ID: {RoleID: standardRoleID}},
		TeamAccessPolicies: portainer.TeamAccessPolicies{teamID: {RoleID: helpdeskRoleID}},
	}))

	h, jwtService, _ := newTestHandler(t, store)

	adminJWT, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: adminUser.ID, Username: adminUser.Username, Role: adminUser.Role})
	targetJWT, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: targetUser.ID, Username: targetUser.Username, Role: targetUser.Role})
	otherJWT, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: otherUser.ID, Username: otherUser.Username, Role: otherUser.Role})

	doRequest := func(t *testing.T, jwt string, path string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(http.MethodGet, path, nil)
		testhelpers.AddTestSecurityCookie(req, jwt)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		return rr
	}

	t.Run("admin can inspect another user", func(t *testing.T) {
		rr := doRequest(t, adminJWT, "/users/2/effective-access")
		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		require.NoError(t, err)

		var resp []EffectiveAccessEntry
		require.NoError(t, json.Unmarshal(body, &resp))
		is.Len(resp, 1)
		is.Equal(envID, resp[0].EndpointID)
		is.Equal(standardRoleID, resp[0].RoleID)
	})

	t.Run("user can inspect themselves", func(t *testing.T) {
		rr := doRequest(t, targetJWT, "/users/2/effective-access")
		is.Equal(http.StatusOK, rr.Code)
	})

	t.Run("non-admin cannot inspect another user", func(t *testing.T) {
		rr := doRequest(t, otherJWT, "/users/2/effective-access")
		is.Equal(http.StatusForbidden, rr.Code)
	})

	t.Run("returns 404 when target user does not exist", func(t *testing.T) {
		rr := doRequest(t, adminJWT, "/users/9999/effective-access")
		is.Equal(http.StatusNotFound, rr.Code)
	})

	t.Run("returns 400 when id is not numeric", func(t *testing.T) {
		rr := doRequest(t, adminJWT, "/users/not-a-number/effective-access")
		is.Equal(http.StatusBadRequest, rr.Code)
	})
}
