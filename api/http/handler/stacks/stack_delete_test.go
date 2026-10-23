package stacks

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/stacks/teardown"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestStackDelete_Success_RemovesStackAndInvokesTeardown(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.DockerComposeStack, Name: "test-stack"}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, []portainer.StackID{stack.ID}, teardownService.torndownStacks)
}

func TestStackDelete_TeardownFails_ReturnsServerError(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	teardownService.resourceErr = errors.New("failed to remove resources")
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.DockerComposeStack, Name: "test-stack"}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestStackDelete_WorkflowSingleArtifact_DeletesWorkflowRecord(t *testing.T) {
	t.Parallel()
	h, store, _ := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	workflow := &portainer.Workflow{ID: 1, Artifacts: []portainer.Artifact{{StackID: 1}}}
	require.NoError(t, store.Workflow().Create(workflow))
	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.DockerComposeStack, Name: "test-stack", WorkflowID: workflow.ID}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)
	_, err = store.Workflow().Read(workflow.ID)
	assert.True(t, store.IsErrObjectNotFound(err))
}

// TestStackDelete_WorkflowAlreadyDeleted_StillDeletesStack covers a double-submit race: a
// concurrent request (e.g. a second click before the delete button disables) already deleted the
// shared Workflow record before this request's transaction runs. The stack must still be deleted
// rather than getting permanently stuck with a dangling WorkflowID, which would break every
// endpoint that resolves git config across all stacks.
func TestStackDelete_WorkflowAlreadyDeleted_StillDeletesStack(t *testing.T) {
	t.Parallel()
	h, store, _ := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.DockerComposeStack, Name: "test-stack", WorkflowID: 999}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)

	_, err = store.Stack().Read(stack.ID)
	assert.True(t, store.IsErrObjectNotFound(err), "stack should be deleted even though its Workflow was already gone")
}

// The workflow deletion and the stack record deletion must commit atomically.
// If record deletion fails, the workflow deletion must roll back too.
func TestStackDelete_RecordDeletionFails_WorkflowDeletionRollsBack(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	teardownService.recordErr = errors.New("db delete failed")
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)
	workflow := &portainer.Workflow{ID: 1, Artifacts: []portainer.Artifact{{StackID: 1}}}
	require.NoError(t, store.Workflow().Create(workflow))
	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.DockerComposeStack, Name: "test-stack", WorkflowID: workflow.ID}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteRequest(stack.ID, endpoint.ID))

	require.Equal(t, http.StatusInternalServerError, w.Code)

	_, err = store.Workflow().Read(workflow.ID)
	require.NoError(t, err, "workflow deletion should roll back when record deletion fails")

	_, err = store.Stack().Read(stack.ID)
	require.NoError(t, err, "stack should survive when record deletion fails")
}

func TestDeleteExternalStack_Success_RemovesResources(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	w := httptest.NewRecorder()
	h.ServeHTTP(w, deleteExternalStackRequest("external-stack", endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, []portainer.StackID{0}, teardownService.torndownStacks)
}

func TestDeleteExternalStack_TeardownFails_ReturnsServerError(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	teardownService.resourceErr = errors.New("failed to remove resources")
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	w := httptest.NewRecorder()
	h.ServeHTTP(w, deleteExternalStackRequest("external-stack", endpoint.ID))

	require.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Empty(t, teardownService.torndownStacks)
}

func TestStackDeleteKubernetesByName_Success_DeletesOnlyMatchingNamespaceStacks(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	matching := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(matching))
	otherNamespace := &portainer.Stack{ID: 2, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns2"}
	require.NoError(t, store.Stack().Create(otherNamespace))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteKubernetesByNameRequest("app", "ns1", endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, []portainer.StackID{matching.ID}, teardownService.torndownStacks)

	_, err = store.Stack().Read(matching.ID)
	assert.True(t, store.IsErrObjectNotFound(err), "matching-namespace stack should be deleted")

	_, err = store.Stack().Read(otherNamespace.ID)
	assert.NoError(t, err, "stack in a different namespace should survive")
}

func TestStackDeleteKubernetesByName_MultipleMatchingStacks_AllDeleted(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	first := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(first))
	second := &portainer.Stack{ID: 2, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(second))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteKubernetesByNameRequest("app", "ns1", endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)
	assert.ElementsMatch(t, []portainer.StackID{first.ID, second.ID}, teardownService.torndownStacks)

	_, err = store.Stack().Read(first.ID)
	assert.True(t, store.IsErrObjectNotFound(err))

	_, err = store.Stack().Read(second.ID)
	assert.True(t, store.IsErrObjectNotFound(err))
}

func TestStackDeleteKubernetesByName_NonKubernetesStackType_ReturnsBadRequest(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.DockerComposeStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteKubernetesByNameRequest("app", "ns1", endpoint.ID))

	require.Equal(t, http.StatusBadRequest, w.Code)
	assert.Empty(t, teardownService.torndownStacks)

	_, err = store.Stack().Read(stack.ID)
	require.NoError(t, err, "stack should survive when it is not a Kubernetes stack")
}

func TestStackDeleteKubernetesByName_NoMatchingNamespace_NoOpSuccess(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteKubernetesByNameRequest("app", "ns-does-not-exist", endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)
	assert.Empty(t, teardownService.torndownStacks)

	_, err = store.Stack().Read(stack.ID)
	require.NoError(t, err, "non-matching stack should survive")
}

// One stack's resource removal failing must not stop the others from being
// torn down — failures are joined and reported after processing every stack.
func TestStackDeleteKubernetesByName_OneResourceRemovalFails_OthersStillDeletedAndErrorReturned(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	failing := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(failing))
	succeeding := &portainer.Stack{ID: 2, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(succeeding))

	teardownService.resourceErrByID = map[portainer.StackID]error{failing.ID: errors.New("kubectl delete failed")}

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteKubernetesByNameRequest("app", "ns1", endpoint.ID))

	require.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Equal(t, []portainer.StackID{succeeding.ID}, teardownService.torndownStacks)

	_, err = store.Stack().Read(failing.ID)
	require.NoError(t, err, "stack whose resource removal failed should survive")

	_, err = store.Stack().Read(succeeding.ID)
	assert.True(t, store.IsErrObjectNotFound(err), "other stacks should still be deleted")
}

// Likewise for record deletion: one stack's DB delete failing must not stop
// the rest, and only that stack's record should survive.
func TestStackDeleteKubernetesByName_OneRecordDeletionFails_OthersStillDeletedAndErrorReturned(t *testing.T) {
	t.Parallel()
	h, store, teardownService := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	failing := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(failing))
	succeeding := &portainer.Stack{ID: 2, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1"}
	require.NoError(t, store.Stack().Create(succeeding))

	teardownService.recordErrByID = map[portainer.StackID]error{failing.ID: errors.New("db delete failed")}

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteKubernetesByNameRequest("app", "ns1", endpoint.ID))

	require.Equal(t, http.StatusInternalServerError, w.Code)
	assert.ElementsMatch(t, []portainer.StackID{failing.ID, succeeding.ID}, teardownService.torndownStacks, "resource removal runs for both before record deletion is attempted")

	_, err = store.Stack().Read(failing.ID)
	require.NoError(t, err, "stack whose record deletion failed should survive")

	_, err = store.Stack().Read(succeeding.ID)
	assert.True(t, store.IsErrObjectNotFound(err), "other stacks should still be deleted")
}

func TestStackDeleteKubernetesByName_WorkflowSingleArtifact_DeletesWorkflowRecord(t *testing.T) {
	t.Parallel()
	h, store, _ := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	workflow := &portainer.Workflow{ID: 1, Artifacts: []portainer.Artifact{{StackID: 1}}}
	require.NoError(t, store.Workflow().Create(workflow))
	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1", WorkflowID: workflow.ID}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteKubernetesByNameRequest("app", "ns1", endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)
	_, err = store.Workflow().Read(workflow.ID)
	assert.True(t, store.IsErrObjectNotFound(err))
}

// TestStackDeleteKubernetesByName_WorkflowAlreadyDeleted_StillDeletesStack mirrors
// TestStackDelete_WorkflowAlreadyDeleted_StillDeletesStack for the Kubernetes-by-name delete path.
func TestStackDeleteKubernetesByName_WorkflowAlreadyDeleted_StillDeletesStack(t *testing.T) {
	t.Parallel()
	h, store, _ := newStackDeleteHandler(t)
	_, err := mockCreateUser(store)
	require.NoError(t, err)
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	stack := &portainer.Stack{ID: 1, EndpointID: endpoint.ID, Type: portainer.KubernetesStack, Name: "app", Namespace: "ns1", WorkflowID: 999}
	require.NoError(t, store.Stack().Create(stack))

	w := httptest.NewRecorder()
	h.ServeHTTP(w, stackDeleteKubernetesByNameRequest("app", "ns1", endpoint.ID))

	require.Equal(t, http.StatusNoContent, w.Code)

	_, err = store.Stack().Read(stack.ID)
	assert.True(t, store.IsErrObjectNotFound(err), "stack should be deleted even though its Workflow was already gone")
}

type stubTeardown struct {
	teardown.Service
	torndownStacks  []portainer.StackID
	resourceErr     error
	recordErr       error
	resourceErrByID map[portainer.StackID]error
	recordErrByID   map[portainer.StackID]error
}

func (s *stubTeardown) RemoveResources(_ context.Context, _ portainer.UserID, stack *portainer.Stack, _ *portainer.Endpoint) error {
	if err := s.resourceErrByID[stack.ID]; err != nil {
		return err
	}

	if s.resourceErr != nil {
		return s.resourceErr
	}

	s.torndownStacks = append(s.torndownStacks, stack.ID)

	return nil
}

func (s *stubTeardown) DeleteRecords(tx dataservices.DataStoreTx, stack *portainer.Stack) error {
	if err := s.recordErrByID[stack.ID]; err != nil {
		return err
	}

	if s.recordErr != nil {
		return s.recordErr
	}

	return tx.Stack().Delete(stack.ID)
}

func (s *stubTeardown) RemoveFiles(_ *portainer.Stack) error { return nil }

func newStackDeleteHandler(t *testing.T) (*Handler, *datastore.Store, *stubTeardown) {
	t.Helper()
	_, store := datastore.MustNewTestStore(t, true, false)
	teardown := &stubTeardown{}
	h := NewHandler(testhelpers.NewTestRequestBouncer(), teardown)
	h.DataStore = store

	return h, store, teardown
}

func stackDeleteRequest(stackID portainer.StackID, endpointID portainer.EndpointID) *http.Request {
	url := "/stacks/" + strconv.Itoa(int(stackID)) + "?endpointId=" + strconv.Itoa(int(endpointID))
	return mockCreateStackRequestWithSecurityContext(http.MethodDelete, url, nil)
}

func stackDeleteKubernetesByNameRequest(name, namespace string, endpointID portainer.EndpointID) *http.Request {
	url := "/stacks/name/" + name + "?endpointId=" + strconv.Itoa(int(endpointID)) + "&namespace=" + namespace
	return mockCreateStackRequestWithSecurityContext(http.MethodDelete, url, nil)
}

func deleteExternalStackRequest(stackName string, endpointID portainer.EndpointID) *http.Request {
	url := "/stacks/" + stackName + "?endpointId=" + strconv.Itoa(int(endpointID)) + "&external=true"
	return mockCreateStackRequestWithSecurityContext(http.MethodDelete, url, nil)
}
