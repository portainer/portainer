package stacks

import (
	"bytes"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

const kubernetesFileStackTestManifest = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
  namespace: default
data:
  key: value
`

const kubernetesFileStackUpdatedTestManifest = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
  namespace: default
data:
  key: updated-value
`

func mockUpdateKubernetesStackFileContentRequest(stackID portainer.StackID, endpointID portainer.EndpointID, payload []byte) *http.Request {
	target := fmt.Sprintf("/stacks/%d?endpointId=%d", stackID, endpointID)
	req := mockCreateStackRequestWithSecurityContext(http.MethodPut, target, bytes.NewBuffer(payload))

	return req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: portainer.AdministratorRole}))
}

// KubernetesClientFactory must be non-nil: updateKubernetesStack calls GetPrivilegedKubeClient on
// it unconditionally, which panics on a nil receiver.
func setupStackUpdateKubernetesTest(t *testing.T, deployErr error) (*Handler, *portainer.Stack, *portainer.Endpoint) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, false, true)

	testDataPath := filesystem.JoinPaths(t.TempDir())
	fileService, err := filesystem.NewService(testDataPath, "")
	require.NoError(t, err, "error init file service")

	_, err = mockCreateUser(store)
	require.NoError(t, err, "error creating user")

	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err, "error creating endpoint")

	stack := &portainer.Stack{
		ID:         1,
		Name:       "k8s-file-stack",
		Type:       portainer.KubernetesStack,
		EndpointID: endpoint.ID,
		EntryPoint: "manifest.yml",
		Namespace:  "default",
		Status:     portainer.StackStatusActive,
	}
	stack.ProjectPath = fileService.GetStackProjectPath(strconv.Itoa(int(stack.ID)))
	require.NoError(t, store.Stack().Create(stack))

	_, err = fileService.StoreStackFileFromBytes(
		strconv.Itoa(int(stack.ID)),
		stack.EntryPoint,
		[]byte(kubernetesFileStackTestManifest),
	)
	require.NoError(t, err, "error storing stack file")

	clientFactory, err := cli.NewClientFactory(nil, nil, store, "test-instance", "", "")
	require.NoError(t, err, "error creating kubernetes client factory")

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store
	handler.FileService = fileService
	handler.KubernetesDeployer = &stubKubernetesDeployer{deployErr: deployErr}
	handler.KubernetesClientFactory = clientFactory

	return handler, stack, endpoint
}

func TestStackUpdate_KubernetesFileContent(t *testing.T) {
	t.Parallel()

	t.Run("successful deploy persists Active status", func(t *testing.T) {
		t.Parallel()

		handler, stack, endpoint := setupStackUpdateKubernetesTest(t, nil)

		payload := kubernetesFileStackUpdatePayload{
			StackFileContent: kubernetesFileStackUpdatedTestManifest,
			StackName:        stack.Name,
		}
		jsonPayload, err := json.Marshal(payload)
		require.NoError(t, err)

		req := mockUpdateKubernetesStackFileContentRequest(stack.ID, endpoint.ID, jsonPayload)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())

		var updated *portainer.Stack
		require.NoError(t, handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			var err error
			updated, err = tx.Stack().Read(stack.ID)
			return err
		}))
		require.Equal(t, portainer.StackStatusActive, updated.Status)
		require.Len(t, updated.DeploymentStatus, 2, "expected a Deploying entry followed by an Active entry")
		require.Equal(t, portainer.StackStatusActive, updated.DeploymentStatus[1].Status)
	})

	t.Run("failed deploy transitions status to Error so the stack isn't stuck showing Deploying", func(t *testing.T) {
		t.Parallel()

		deployErr := errors.New("failed to apply resources")
		handler, stack, endpoint := setupStackUpdateKubernetesTest(t, deployErr)

		payload := kubernetesFileStackUpdatePayload{
			StackFileContent: kubernetesFileStackUpdatedTestManifest,
			StackName:        stack.Name,
		}
		jsonPayload, err := json.Marshal(payload)
		require.NoError(t, err)

		req := mockUpdateKubernetesStackFileContentRequest(stack.ID, endpoint.ID, jsonPayload)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, http.StatusInternalServerError, rec.Code, rec.Body.String())

		var updated *portainer.Stack
		require.NoError(t, handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			var err error
			updated, err = tx.Stack().Read(stack.ID)
			return err
		}))
		require.Equal(t, portainer.StackStatusError, updated.Status, "status should transition to Error, not stay stuck at Deploying, so the stack can be retried")
		require.Len(t, updated.DeploymentStatus, 2, "expected the persisted Deploying entry followed by an Error entry")
		require.Equal(t, portainer.StackStatusDeploying, updated.DeploymentStatus[0].Status)
		require.Equal(t, portainer.StackStatusError, updated.DeploymentStatus[1].Status)
	})

	t.Run("renaming the stack persists the new name through the transaction", func(t *testing.T) {
		t.Parallel()

		handler, stack, endpoint := setupStackUpdateKubernetesTest(t, nil)

		payload := kubernetesFileStackUpdatePayload{
			StackFileContent: kubernetesFileStackUpdatedTestManifest,
			StackName:        "renamed-k8s-file-stack",
		}
		jsonPayload, err := json.Marshal(payload)
		require.NoError(t, err)

		req := mockUpdateKubernetesStackFileContentRequest(stack.ID, endpoint.ID, jsonPayload)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())

		var updated *portainer.Stack
		require.NoError(t, handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			var err error
			updated, err = tx.Stack().Read(stack.ID)
			return err
		}))
		require.Equal(t, "renamed-k8s-file-stack", updated.Name)
	})
}
