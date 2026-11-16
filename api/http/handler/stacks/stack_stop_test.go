package stacks

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/stretchr/testify/require"
)

func TestStackStop_NonAdminOtherEnvironment_IsRejected(t *testing.T) {
	t.Parallel()
	h, store := newStackStartHandler(t)

	user := &portainer.User{ID: 2, Username: "user", Role: portainer.StandardUserRole}
	err := store.User().Create(user)
	require.NoError(t, err)

	for _, id := range []portainer.EndpointID{1, 2} {
		err = store.Endpoint().Create(&portainer.Endpoint{ID: id, Name: "env" + strconv.Itoa(int(id)), SecuritySettings: portainer.EndpointSecuritySettings{AllowStackManagementForRegularUsers: true}})
		require.NoError(t, err)
	}

	stack := newStartableStack(1)
	stack.Status = portainer.StackStatusActive
	err = store.Stack().Create(stack)
	require.NoError(t, err)

	err = store.ResourceControl().Create(&portainer.ResourceControl{ResourceID: stackutils.ResourceControlID(1, stack.Name), Type: portainer.StackResourceControl, Public: true})
	require.NoError(t, err)

	h.ComposeStackManager = &stubComposeStackManager{}
	h.StackDeployer = &stubStackDeployer{}

	req := httptest.NewRequest(http.MethodPost, "/stacks/"+strconv.Itoa(int(stack.ID))+"/stop?endpointId=2", nil)
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: user.ID, User: user}))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	require.Equal(t, http.StatusForbidden, w.Code)

	updated, err := store.Stack().Read(stack.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.StackStatusActive, updated.Status, "the stack must not be undeployed from another environment")
}
