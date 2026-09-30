package kubernetes

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/require"
)

// TestProxyNamespaceDeleteOperation_DetachesWorkflowAndDeletesStackAtomically covers the fix for
// BE-13446: detaching the workflow artifact and deleting the Stack record used to run as two
// separate BoltDB transactions, so a crash between them could leave the Stack alive with a
// WorkflowID pointing at an already-deleted Workflow. Both must now commit together.
func TestProxyNamespaceDeleteOperation_DetachesWorkflowAndDeletesStackAtomically(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 1}}}
	err := store.Workflow().Create(wf)
	require.NoError(t, err)

	stack := &portainer.Stack{ID: 1, Namespace: "my-namespace", EndpointID: 1, WorkflowID: wf.ID}
	err = store.Stack().Create(stack)
	require.NoError(t, err)

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	request, err := http.NewRequest(http.MethodDelete, upstream.URL, nil)
	require.NoError(t, err)

	transport := &baseTransport{
		httpTransport: http.DefaultTransport.(*http.Transport),
		tokenManager:  &tokenManager{kubecli: testhelpers.NewKubernetesClient()},
		endpoint:      &portainer.Endpoint{ID: 1},
		dataStore:     store,
	}

	resp, err := transport.proxyNamespaceDeleteOperation(request, "my-namespace")
	require.NoError(t, err)

	err = resp.Body.Close()
	require.NoError(t, err)

	_, err = store.Stack().Read(stack.ID)
	require.True(t, store.IsErrObjectNotFound(err), "stack should be deleted")

	_, err = store.Workflow().Read(wf.ID)
	require.True(t, store.IsErrObjectNotFound(err), "single-artifact workflow should be detached and deleted")
}

type failAfterUpdateTxDataStore struct {
	dataservices.DataStore
}

func (s failAfterUpdateTxDataStore) UpdateTx(fn func(tx dataservices.DataStoreTx) error) error {
	return s.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := fn(tx); err != nil {
			return err
		}

		return errors.New("injected failure after the transaction body ran")
	})
}

// If the transaction fails after the workflow detach and the stack deletion ran, both must roll back
func TestProxyNamespaceDeleteOperation_TransactionFails_RollsBackWorkflowAndStack(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 1}}}
	err := store.Workflow().Create(wf)
	require.NoError(t, err)

	stack := &portainer.Stack{ID: 1, Namespace: "my-namespace", EndpointID: 1, WorkflowID: wf.ID}
	err = store.Stack().Create(stack)
	require.NoError(t, err)

	request, err := http.NewRequest(http.MethodDelete, "http://example.com", nil)
	require.NoError(t, err)

	transport := &baseTransport{
		httpTransport: &http.Transport{},
		tokenManager:  &tokenManager{kubecli: testhelpers.NewKubernetesClient()},
		endpoint:      &portainer.Endpoint{ID: 1},
		dataStore:     failAfterUpdateTxDataStore{DataStore: store},
	}

	resp, err := transport.proxyNamespaceDeleteOperation(request, "my-namespace")
	if resp != nil {
		defer func() { _ = resp.Body.Close() }()
	}
	require.Error(t, err)

	_, err = store.Stack().Read(stack.ID)
	require.NoError(t, err, "stack should survive when the transaction fails")

	_, err = store.Workflow().Read(wf.ID)
	require.NoError(t, err, "workflow detach should roll back when the transaction fails")
}
