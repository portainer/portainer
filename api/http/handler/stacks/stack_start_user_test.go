package stacks

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"

	"github.com/stretchr/testify/require"
)

func TestStackStart_UnknownUser_ReturnsInternalServerError(t *testing.T) {
	t.Parallel()

	h, store := newStackStartHandler(t)

	endpoint := createDockerEndpoint(t, h, store)

	stack := newStartableStack(endpoint.ID)
	err := store.Stack().Create(stack)
	require.NoError(t, err)

	h.ComposeStackManager = &stubComposeStackManager{}
	h.StackDeployer = &stubStackDeployer{}

	req := httptest.NewRequest(http.MethodPost, "/stacks/"+strconv.Itoa(int(stack.ID))+"/start?endpointId="+strconv.Itoa(int(endpoint.ID)), nil)
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{IsAdmin: true, UserID: portainer.UserID(99)}))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	require.Equal(t, http.StatusInternalServerError, w.Code)

	updated, err := store.Stack().Read(stack.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.StackStatusInactive, updated.Status)
}
