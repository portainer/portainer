package stacks

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/stretchr/testify/require"
)

type stubComposeStackManager struct {
	portainer.ComposeStackManager
	upCalled bool
}

func (s *stubComposeStackManager) NormalizeStackName(name string) string { return name }

func (s *stubComposeStackManager) Up(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint, _ portainer.ComposeUpOptions) error {
	s.upCalled = true

	return nil
}

type stubStackDeployer struct {
	deployments.StackDeployer
}

func (s *stubStackDeployer) GetDockerClientFactory() *dockerclient.ClientFactory {
	return nil
}

func newStackStartHandler(t *testing.T) (*Handler, *datastore.Store) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, false)
	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	return h, store
}

func createDockerEndpoint(t *testing.T, h *Handler, store *datastore.Store) *portainer.Endpoint {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("[]"))
	}))
	t.Cleanup(server.Close)

	h.DockerClientFactory = dockerclient.NewClientFactory(nil, nil)

	endpoint := &portainer.Endpoint{
		ID:               1,
		Name:             "testEndpoint",
		URL:              "tcp://" + server.Listener.Addr().String(),
		SecuritySettings: portainer.EndpointSecuritySettings{AllowStackManagementForRegularUsers: true},
	}

	err := store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	return endpoint
}

func newStartableStack(endpointID portainer.EndpointID) *portainer.Stack {
	return &portainer.Stack{
		ID:         1,
		EndpointID: endpointID,
		Type:       portainer.DockerComposeStack,
		Name:       "test-stack",
		Status:     portainer.StackStatusInactive,
	}
}

func stackStartRequest(stackID portainer.StackID, endpointID portainer.EndpointID) *http.Request {
	return mockCreateStackRequestWithSecurityContext(http.MethodPost, "/stacks/"+strconv.Itoa(int(stackID))+"/start?endpointId="+strconv.Itoa(int(endpointID)), nil)
}

func TestStackStart_ActiveStack_ReturnsBadRequest(t *testing.T) {
	t.Parallel()

	h, store := newStackStartHandler(t)

	_, err := mockCreateUser(store)
	require.NoError(t, err)

	endpoint := createDockerEndpoint(t, h, store)

	stack := newStartableStack(endpoint.ID)
	stack.Status = portainer.StackStatusActive
	err = store.Stack().Create(stack)
	require.NoError(t, err)

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusBadRequest, w.Code)
}

func TestStackStart_AdminStartSuccess_StackStatusSetToActive(t *testing.T) {
	t.Parallel()

	h, store := newStackStartHandler(t)

	_, err := mockCreateUser(store)
	require.NoError(t, err)

	endpoint := createDockerEndpoint(t, h, store)

	stack := newStartableStack(endpoint.ID)
	err = store.Stack().Create(stack)
	require.NoError(t, err)

	composeManager := &stubComposeStackManager{}
	h.ComposeStackManager = composeManager
	h.StackDeployer = &stubStackDeployer{}

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusOK, w.Code)
	require.True(t, composeManager.upCalled)

	updated, err := store.Stack().Read(stack.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.StackStatusActive, updated.Status)
}

func TestStackStart_NonAdminRestrictedCompose_IsRejected(t *testing.T) {
	t.Parallel()

	h, store := newStackStartHandler(t)

	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err)

	h.FileService = fileService

	user := &portainer.User{ID: 2, Username: "user", Role: portainer.StandardUserRole}
	err = store.User().Create(user)
	require.NoError(t, err)

	endpoint := createDockerEndpoint(t, h, store)

	projectPath := t.TempDir()
	err = os.WriteFile(filesystem.JoinPaths(projectPath, "docker-compose.yml"), []byte("services:\n  web:\n    image: alpine\n    volumes:\n      - /:/host\n"), 0o600)
	require.NoError(t, err)

	stack := newStartableStack(endpoint.ID)
	stack.ProjectPath = projectPath
	stack.EntryPoint = "docker-compose.yml"
	err = store.Stack().Create(stack)
	require.NoError(t, err)

	err = store.ResourceControl().Create(&portainer.ResourceControl{ResourceID: stackutils.ResourceControlID(endpoint.ID, stack.Name), Type: portainer.StackResourceControl, Public: true})
	require.NoError(t, err)

	composeManager := &stubComposeStackManager{}
	h.ComposeStackManager = composeManager
	h.StackDeployer = &stubStackDeployer{}

	req := httptest.NewRequest(http.MethodPost, "/stacks/"+strconv.Itoa(int(stack.ID))+"/start?endpointId="+strconv.Itoa(int(endpoint.ID)), nil)
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: user.ID}))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	require.Equal(t, http.StatusForbidden, w.Code)
	require.False(t, composeManager.upCalled, "a restricted compose file must not be started")

	updated, err := store.Stack().Read(stack.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.StackStatusInactive, updated.Status)
}

func TestStackStart_AutoUpdateInterval(t *testing.T) {
	t.Parallel()

	h, store := newStackStartHandler(t)

	_, err := mockCreateUser(store)
	require.NoError(t, err)

	endpoint := createDockerEndpoint(t, h, store)

	h.ComposeStackManager = &stubComposeStackManager{}
	h.StackDeployer = &stubStackDeployer{}
	h.Scheduler = scheduler.NewScheduler(t.Context())

	t.Cleanup(func() {
		err := h.Scheduler.Shutdown()
		require.NoError(t, err)
	})

	// An unparsable interval is rejected before the stack is started
	bad := newStartableStack(endpoint.ID)
	bad.AutoUpdate = &portainer.AutoUpdateSettings{Interval: "not-a-duration"}
	err = store.Stack().Create(bad)
	require.NoError(t, err)

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(bad.ID, endpoint.ID))
	require.Equal(t, http.StatusBadRequest, w.Code)

	updated, err := store.Stack().Read(bad.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.StackStatusInactive, updated.Status)

	// A valid interval restarts the polling job and records its id
	good := newStartableStack(endpoint.ID)
	good.ID = 2
	good.Name = "good-stack"
	good.AutoUpdate = &portainer.AutoUpdateSettings{Interval: "1h"}
	err = store.Stack().Create(good)
	require.NoError(t, err)

	w = httptest.NewRecorder()
	h.ServeHTTP(w, stackStartRequest(good.ID, endpoint.ID))
	require.Equal(t, http.StatusOK, w.Code)

	updated, err = store.Stack().Read(good.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.StackStatusActive, updated.Status)
	require.NotEmpty(t, updated.AutoUpdate.JobID)
}
