package stacks

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Stubs
type stubComposeStackManager struct {
	portainer.ComposeStackManager
}

func (s *stubComposeStackManager) NormalizeStackName(name string) string { return name }

type stubStackDeployer struct {
	deployments.StackDeployer
	deployErr error
}

func (s *stubStackDeployer) DeployComposeStack(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint, _ []portainer.Registry, _, _, _ bool) error {
	return s.deployErr
}

func stackStartRequest(stackID portainer.StackID, endpointID portainer.EndpointID) *http.Request {
	url := "/stacks/" + strconv.Itoa(int(stackID)) + "/start?endpointId=" + strconv.Itoa(int(endpointID))
	return mockCreateStackRequestWithSecurityContext(http.MethodPost, url, nil)
}

func newStackStartHandler(t *testing.T) (*Handler, *datastore.Store) {
	t.Helper()
	_, store := datastore.MustNewTestStore(t, true, false)
	h := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	h.DataStore = store
	return h, store
}

func TestStackStart_ActiveStack_ReturnsConflict(t *testing.T) {
	t.Parallel()
	h, store := newStackStartHandler(t)
	stack := &portainer.Stack{ID: 1, Status: portainer.StackStatusActive}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(stack.ID, 1))

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestStackStart_DeployingStack_ReturnsConflict(t *testing.T) {
	t.Parallel()
	h, store := newStackStartHandler(t)
	stack := &portainer.Stack{ID: 1, Status: portainer.StackStatusDeploying}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(stack.ID, 1))

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestStackStart_ErrorStack_ReturnsConflict(t *testing.T) {
	t.Parallel()
	h, store := newStackStartHandler(t)
	stack := &portainer.Stack{ID: 1, Status: portainer.StackStatusError}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(stack.ID, 1))

	assert.Equal(t, http.StatusConflict, w.Code)
}

func newStartableStack(endpointID portainer.EndpointID) *portainer.Stack {
	return &portainer.Stack{
		ID:         1,
		EndpointID: endpointID,
		Type:       portainer.DockerComposeStack,
		Name:       "test-stack",
	}
}

func TestStackStart_StartSuccess_StackStatusSetToActive(t *testing.T) {
	t.Parallel()
	h, store := newStackStartHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	stack := newStartableStack(endpoint.ID)
	require.NoError(t, store.Stack().Create(stack))
	h.ComposeStackManager = &stubComposeStackManager{}
	h.StackDeployer = &stubStackDeployer{}

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusOK, w.Code)
	updated, err := store.Stack().Read(stack.ID)
	require.NoError(t, err)
	assert.Equal(t, portainer.StackStatusActive, updated.Status)
	require.Len(t, updated.DeploymentStatus, 1)
	assert.Equal(t, portainer.StackStatusActive, updated.DeploymentStatus[0].Status)
}

func TestStackStart_StartFailure_StackStatusSetToError(t *testing.T) {
	t.Parallel()
	deployErr := errors.New("failed to pull image nginx:999")
	h, store := newStackStartHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	stack := newStartableStack(endpoint.ID)
	require.NoError(t, store.Stack().Create(stack))
	h.ComposeStackManager = &stubComposeStackManager{}
	h.StackDeployer = &stubStackDeployer{deployErr: deployErr}

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusInternalServerError, w.Code)
	updated, err := store.Stack().Read(stack.ID)
	require.NoError(t, err)
	assert.Equal(t, portainer.StackStatusError, updated.Status)
	require.Len(t, updated.DeploymentStatus, 1)
	lastEntry := updated.DeploymentStatus[0]
	assert.Equal(t, portainer.StackStatusError, lastEntry.Status)
	assert.Equal(t, deployErr.Error(), lastEntry.Message)
}
