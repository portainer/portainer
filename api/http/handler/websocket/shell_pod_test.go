package websocket

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newWebsocketTestHandler builds a websocket Handler backed by a test store with a single
// Kubernetes environment (ID 2) and a real bouncer, returning both the handler and that
// endpoint so callers can grant access via its UserAccessPolicies. KubernetesClientFactory is
// left nil so any handler that proceeds past authorization trips a clear panic. Shared by the
// exec/attach/pod/kubernetes-shell L2 tests (BE-13027).
func newWebsocketTestHandler(t *testing.T) (*Handler, *portainer.Endpoint) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, false)

	endpoint := &portainer.Endpoint{
		ID:      2,
		Name:    "target-env",
		Type:    portainer.AgentOnKubernetesEnvironment,
		GroupID: 1,
	}
	require.NoError(t, store.Endpoint().Create(endpoint))

	bouncer := security.NewRequestBouncer(t.Context(), store, nil, nil)

	handler := &Handler{
		DataStore:      store,
		requestBouncer: bouncer,
		// KubernetesClientFactory intentionally left nil.
	}

	return handler, endpoint
}

// TestWebsocketShellPodExec_deniesUnauthorizedEndpoint asserts a non-admin with no access
// policy on the environment is rejected with 403 — the environment-access (L2) gate (BE-13027).
func TestWebsocketShellPodExec_deniesUnauthorizedEndpoint(t *testing.T) {
	handler, _ := newWebsocketTestHandler(t)

	user := &portainer.User{Username: "restricted", Role: portainer.StandardUserRole}
	err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(user)
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/websocket/kubernetes-shell?endpointId=2", nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Role: portainer.StandardUserRole}))

	handlerErr := handler.websocketShellPodExec(httptest.NewRecorder(), req)

	require.NotNil(t, handlerErr, "expected an authorization error for a denied environment")
	assert.Equal(t, http.StatusForbidden, handlerErr.StatusCode)
}

// TestWebsocketShellPodExec_allowsAuthorizedEndpoint asserts an admin passes authorization and
// reaches the nil KubernetesClientFactory (panic proves auth did not block the request) (BE-13027).
func TestWebsocketShellPodExec_allowsAuthorizedEndpoint(t *testing.T) {
	handler, _ := newWebsocketTestHandler(t)

	req := httptest.NewRequest(http.MethodGet, "/websocket/kubernetes-shell?endpointId=2", nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: 1, Role: portainer.AdministratorRole}))

	assert.Panics(t, func() {
		_ = handler.websocketShellPodExec(httptest.NewRecorder(), req)
	})
}

// TestWebsocketShellPodExec_allowsAuthorizedNonAdmin asserts a non-admin granted environment
// access passes authorization (reaching the nil client and panicking). CE has no operation-level
// (L3) layer, so environment access is the only gate (BE-13027).
func TestWebsocketShellPodExec_allowsAuthorizedNonAdmin(t *testing.T) {
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

	req := httptest.NewRequest(http.MethodGet, "/websocket/kubernetes-shell?endpointId=2", nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Role: portainer.StandardUserRole}))

	assert.Panics(t, func() {
		_ = handler.websocketShellPodExec(httptest.NewRecorder(), req)
	})
}
