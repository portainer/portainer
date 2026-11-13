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

// TestWebsocketAttach_deniesUnauthorizedEndpoint asserts a non-admin with no access policy on
// the environment is rejected with 403 — the environment-access (L2) gate (BE-13027).
func TestWebsocketAttach_deniesUnauthorizedEndpoint(t *testing.T) {
	handler, _ := newWebsocketTestHandler(t)

	user := &portainer.User{Username: "restricted", Role: portainer.StandardUserRole}
	err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(user)
	})
	require.NoError(t, err)

	// attach requires a hexadecimal `id` query parameter to reach the authorization check.
	req := httptest.NewRequest(http.MethodGet, "/websocket/attach?id=abcdef&endpointId=2", nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Role: portainer.StandardUserRole}))

	handlerErr := handler.websocketAttach(httptest.NewRecorder(), req)

	require.NotNil(t, handlerErr, "expected an authorization error for a denied environment")
	assert.Equal(t, http.StatusForbidden, handlerErr.StatusCode)
}

func TestWebsocketAttach_containerResourceControl(t *testing.T) {
	t.Parallel()

	fx := newDockerAccessFixture(t)

	// A request that passes authorization reaches the websocket upgrade, which fails on a plain
	// recorder, so the upgrade failure message means allowed
	f := func(user portainer.User, id string, expectedStatus int, expectedMessage string) {
		t.Helper()

		req := httptest.NewRequest(http.MethodGet, "/websocket/attach?id="+id+"&endpointId=3", nil)
		req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Role: user.Role}))

		handlerErr := fx.handler.websocketAttach(httptest.NewRecorder(), req)
		require.NotNil(t, handlerErr)
		require.Equal(t, expectedStatus, handlerErr.StatusCode)
		require.Equal(t, expectedMessage, handlerErr.Message)
	}

	// admin can attach to any container, even one without a resource control
	f(fx.admin, ownedContainerID, http.StatusInternalServerError, attachUpgradeFailedMessage)
	f(fx.admin, unmanagedContainerID, http.StatusInternalServerError, attachUpgradeFailedMessage)

	// owner can attach to its own container
	f(fx.owner, ownedContainerID, http.StatusInternalServerError, attachUpgradeFailedMessage)

	// owner can attach using a short prefix of its own container
	f(fx.owner, "aaaa", http.StatusInternalServerError, attachUpgradeFailedMessage)

	// another user cannot attach to the owner's container
	f(fx.other, ownedContainerID, http.StatusForbidden, containerDeniedMessage)

	// another user cannot attach using a short prefix of the owner's container
	f(fx.other, "aaaa", http.StatusForbidden, containerDeniedMessage)

	// team member can attach to a container shared with its team
	f(fx.teammate, teamContainerID, http.StatusInternalServerError, attachUpgradeFailedMessage)

	// user outside the team cannot attach to the team container
	f(fx.other, teamContainerID, http.StatusForbidden, containerDeniedMessage)

	// owner can attach to a container inheriting its stack resource control
	f(fx.owner, stackContainerID, http.StatusInternalServerError, attachUpgradeFailedMessage)

	// another user cannot attach to a container inheriting the owner's stack resource control
	f(fx.other, stackContainerID, http.StatusForbidden, containerDeniedMessage)

	// non-admin cannot attach to a container without a resource control
	f(fx.owner, unmanagedContainerID, http.StatusForbidden, containerDeniedMessage)

	// unknown container is denied without exposing the Docker error
	f(fx.owner, "0123", http.StatusForbidden, containerDeniedMessage)

	// a Docker failure is reported as a server error
	f(fx.owner, "dead", http.StatusInternalServerError, verifyAccessFailedMessage)

	// the resolved full container ID is forwarded instead of the short prefix
	req := httptest.NewRequest(http.MethodGet, "/websocket/attach?id=aaaa&endpointId=3", nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: fx.owner.ID, Role: fx.owner.Role}))

	handlerErr := fx.handler.websocketAttach(httptest.NewRecorder(), req)
	require.NotNil(t, handlerErr)
	require.Equal(t, ownedContainerID, req.URL.Query().Get("id"))
}
