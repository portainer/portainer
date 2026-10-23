package websocket

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// podExecQuery is the minimal set of query parameters required to reach the authorization
// check in websocketPodExec.
const podExecQuery = "/websocket/pod?endpointId=2&namespace=default&podName=p&containerName=c&command=sh"

// TestWebsocketPodExec_deniesUnauthorizedEndpoint asserts a non-admin with no access policy on
// the environment is rejected with 403 — the environment-access (L2) gate (BE-13027).
func TestWebsocketPodExec_deniesUnauthorizedEndpoint(t *testing.T) {
	handler, _ := newWebsocketTestHandler(t)

	user := &portainer.User{Username: "restricted", Role: portainer.StandardUserRole}
	err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(user)
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, podExecQuery, nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Role: portainer.StandardUserRole}))

	handlerErr := handler.websocketPodExec(httptest.NewRecorder(), req)

	require.NotNil(t, handlerErr, "expected an authorization error for a denied environment")
	assert.Equal(t, http.StatusForbidden, handlerErr.StatusCode)
}

// TestWebsocketPodExec_allowsAuthorizedNonAdmin asserts a non-admin granted environment access
// passes authorization (reaching the nil client via getToken and panicking). CE has no
// operation-level (L3) layer, so environment access is the only gate (BE-13027).
func TestWebsocketPodExec_allowsAuthorizedNonAdmin(t *testing.T) {
	handler, endpoint := newWebsocketTestHandler(t)

	user := &portainer.User{Username: "standard", Role: portainer.StandardUserRole}
	err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.User().Create(user); err != nil {
			return err
		}
		// Access is by membership; the access policy's role is irrelevant to the CE access decision.
		endpoint.UserAccessPolicies = portainer.UserAccessPolicies{user.ID: {}}
		return tx.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, podExecQuery, nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Role: portainer.StandardUserRole}))

	assert.Panics(t, func() {
		_ = handler.websocketPodExec(httptest.NewRecorder(), req)
	})
}
