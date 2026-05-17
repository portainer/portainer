package stacks

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type stubDeleteStackDeployer struct {
	deployments.StackDeployer
	undeployErr error
}

func (s *stubDeleteStackDeployer) UndeployComposeStack(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint) error {
	return s.undeployErr
}

func stackDeleteRequest(stackID portainer.StackID, endpointID portainer.EndpointID, force bool) *http.Request {
	url := "/stacks/" + strconv.Itoa(int(stackID)) + "?endpointId=" + strconv.Itoa(int(endpointID))
	if force {
		url += "&force=true"
	}
	return mockCreateStackRequestWithSecurityContext(http.MethodDelete, url, nil)
}

func newDeleteStackHandler(t *testing.T, undeployErr error) (*Handler, *datastore.Store) {
	t.Helper()
	_, store := datastore.MustNewTestStore(t, true, false)
	fileService, err := filesystem.NewService(filesystem.JoinPaths(t.TempDir()), "")
	require.NoError(t, err)
	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store
	h.ComposeStackManager = &stubComposeStackManager{}
	h.StackDeployer = &stubDeleteStackDeployer{undeployErr: undeployErr}
	h.FileService = fileService
	return h, store
}

func newDeletableComposeStack(endpointID portainer.EndpointID) *portainer.Stack {
	return &portainer.Stack{
		ID:         1,
		EndpointID: endpointID,
		Type:       portainer.DockerComposeStack,
		Name:       "test-stack",
	}
}

func TestStackDelete_UndeploySuccess_RemovesRecord(t *testing.T) {
	t.Parallel()
	h, store := newDeleteStackHandler(t, nil)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	stack := newDeletableComposeStack(endpoint.ID)
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteRequest(stack.ID, endpoint.ID, false))

	require.Equal(t, http.StatusNoContent, w.Code)
	_, err = store.Stack().Read(stack.ID)
	require.True(t, store.IsErrObjectNotFound(err), "stack record should be removed from the database")
}

func TestStackDelete_UndeployFails_NoForce_PreservesRecord(t *testing.T) {
	t.Parallel()
	h, store := newDeleteStackHandler(t, errors.New("compose down operation failed: Cannot connect to the Docker daemon"))
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	stack := newDeletableComposeStack(endpoint.ID)
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteRequest(stack.ID, endpoint.ID, false))

	require.Equal(t, http.StatusInternalServerError, w.Code)
	persisted, err := store.Stack().Read(stack.ID)
	require.NoError(t, err, "stack record should still exist when undeploy fails without force")
	assert.Equal(t, stack.ID, persisted.ID)
}

func TestStackDelete_UndeployFails_WithForce_RemovesRecord(t *testing.T) {
	t.Parallel()
	h, store := newDeleteStackHandler(t, errors.New("compose down operation failed: Cannot connect to the Docker daemon"))
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	stack := newDeletableComposeStack(endpoint.ID)
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteRequest(stack.ID, endpoint.ID, true))

	require.Equal(t, http.StatusNoContent, w.Code, "force=true should allow record removal even when undeploy fails")
	_, err = store.Stack().Read(stack.ID)
	require.True(t, store.IsErrObjectNotFound(err), "stack record should be removed from the database when force=true")
}
