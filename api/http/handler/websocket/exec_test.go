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

// TestWebsocketExec_deniesUnauthorizedEndpoint asserts a non-admin with no access policy on
// the environment is rejected with 403 — the environment-access (L2) gate (BE-13027).
func TestWebsocketExec_deniesUnauthorizedEndpoint(t *testing.T) {
	handler, _ := newWebsocketTestHandler(t)

	user := &portainer.User{Username: "restricted", Role: portainer.StandardUserRole}
	err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(user)
	})
	require.NoError(t, err)

	// exec requires a hexadecimal `id` query parameter to reach the authorization check.
	req := httptest.NewRequest(http.MethodGet, "/websocket/exec?id=abcdef&endpointId=2", nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Role: portainer.StandardUserRole}))

	handlerErr := handler.websocketExec(httptest.NewRecorder(), req)

	require.NotNil(t, handlerErr, "expected an authorization error for a denied environment")
	assert.Equal(t, http.StatusForbidden, handlerErr.StatusCode)
}

func TestWebsocketExec_containerResourceControl(t *testing.T) {
	t.Parallel()

	fx := newDockerAccessFixture(t)

	// A request that passes authorization reaches the websocket upgrade, which fails on a plain
	// recorder, so the upgrade failure message means allowed
	f := func(user portainer.User, id string, expectedStatus int, expectedMessage string) {
		t.Helper()

		req := httptest.NewRequest(http.MethodGet, "/websocket/exec?id="+id+"&endpointId=3", nil)
		req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Role: user.Role}))

		handlerErr := fx.handler.websocketExec(httptest.NewRecorder(), req)
		require.NotNil(t, handlerErr)
		require.Equal(t, expectedStatus, handlerErr.StatusCode)
		require.Equal(t, expectedMessage, handlerErr.Message)
	}

	// admin can start any exec instance
	f(fx.admin, ownedExecID, http.StatusInternalServerError, execUpgradeFailedMessage)
	f(fx.admin, unmanagedExecID, http.StatusInternalServerError, execUpgradeFailedMessage)

	// owner can start an exec instance of its own container
	f(fx.owner, ownedExecID, http.StatusInternalServerError, execUpgradeFailedMessage)

	// another user cannot start an exec instance of the owner's container
	f(fx.other, ownedExecID, http.StatusForbidden, containerDeniedMessage)

	// non-admin cannot start an exec instance of a container without a resource control
	f(fx.owner, unmanagedExecID, http.StatusForbidden, containerDeniedMessage)

	// unknown exec instance is denied without exposing the Docker error
	f(fx.owner, "0123", http.StatusForbidden, containerDeniedMessage)

	// a Docker failure is reported as a server error
	f(fx.owner, "dead", http.StatusInternalServerError, verifyAccessFailedMessage)
}
