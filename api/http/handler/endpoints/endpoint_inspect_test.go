package endpoints

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/snapshot"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/pendingactions"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupEndpointInspectHandler(t *testing.T, endpoints []portainer.Endpoint, edgeAgentCheckinInterval int) *Handler {
	_, store := datastore.MustNewTestStore(t, true, true)

	settings, err := store.Settings().Settings()
	require.NoError(t, err, "error retrieving settings")
	settings.EdgeAgentCheckinInterval = edgeAgentCheckinInterval
	require.NoError(t, store.Settings().UpdateSettings(settings), "error updating settings")

	for _, endpoint := range endpoints {
		err := store.Endpoint().Create(&endpoint)
		require.NoError(t, err, "error creating environment")
	}

	err = store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	require.NoError(t, err, "error creating a user")

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store
	handler.ComposeStackManager = testhelpers.NewComposeStackManager()
	handler.SnapshotService, _ = snapshot.NewService("1s", store, nil, nil, nil)
	handler.PendingActionsService = pendingactions.NewService(store, nil)

	return handler
}

func doEndpointInspectRequest(t *testing.T, h *Handler, id portainer.EndpointID) portainer.Endpoint {
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/endpoints/%d?excludeSnapshot=true", id), nil)

	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
	req = req.WithContext(ctx)

	restrictedCtx := security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
	req = req.WithContext(restrictedCtx)

	testhelpers.AddTestSecurityCookie(req, "Bearer dummytoken")

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	require.Equal(t, http.StatusOK, rr.Code, "Status should be 200")

	body, err := io.ReadAll(rr.Body)
	require.NoError(t, err)

	var endpoint portainer.Endpoint
	require.NoError(t, json.Unmarshal(body, &endpoint))

	return endpoint
}

// Test_EndpointInspect_EdgeCheckinInterval ensures the inspect response resolves the
// effective edge check-in interval the same way the list response does. Edge endpoints
// without a specific interval fall back to the global default, while non-edge endpoints
// report no interval. See https://github.com/portainer/portainer/issues/5384.
func Test_EndpointInspect_EdgeCheckinInterval(t *testing.T) {
	t.Parallel()

	const globalCheckinInterval = 60

	edgeNoInterval := portainer.Endpoint{ID: 1, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment, UserTrusted: true}
	edgeWithInterval := portainer.Endpoint{ID: 2, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment, EdgeCheckinInterval: 7, UserTrusted: true}
	nonEdge := portainer.Endpoint{ID: 3, GroupID: 1, Type: portainer.DockerEnvironment}

	handler := setupEndpointInspectHandler(t, []portainer.Endpoint{edgeNoInterval, edgeWithInterval, nonEdge}, globalCheckinInterval)

	tests := []struct {
		name     string
		id       portainer.EndpointID
		expected int
	}{
		{"edge endpoint without a specific interval falls back to the global default", 1, globalCheckinInterval},
		{"edge endpoint with a specific interval keeps its own value", 2, 7},
		{"non-edge endpoint reports no check-in interval", 3, 0},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			endpoint := doEndpointInspectRequest(t, handler, tc.id)
			assert.Equal(t, tc.expected, endpoint.EdgeCheckinInterval)
		})
	}
}

// Test_EndpointCheckinInterval_ListMatchesInspect guards against the list and inspect
// endpoints reporting different EdgeCheckinInterval values for the same environment,
// which was the regression reported in issue 5384.
func Test_EndpointCheckinInterval_ListMatchesInspect(t *testing.T) {
	t.Parallel()

	const globalCheckinInterval = 60

	endpoints := []portainer.Endpoint{
		{ID: 1, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment, UserTrusted: true},
		{ID: 2, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment, EdgeCheckinInterval: 7, UserTrusted: true},
		{ID: 3, GroupID: 1, Type: portainer.DockerEnvironment},
	}

	handler := setupEndpointInspectHandler(t, endpoints, globalCheckinInterval)

	is := assert.New(t)
	listed, err := doEndpointListRequest(buildEndpointListRequest(""), handler, is)
	require.NoError(t, err)

	listedIntervals := make(map[portainer.EndpointID]int, len(listed))
	for _, endpoint := range listed {
		listedIntervals[endpoint.ID] = endpoint.EdgeCheckinInterval
	}

	for _, endpoint := range endpoints {
		inspected := doEndpointInspectRequest(t, handler, endpoint.ID)
		is.Equal(listedIntervals[endpoint.ID], inspected.EdgeCheckinInterval,
			"list and inspect must report the same check-in interval for endpoint %d", endpoint.ID)
	}
}
