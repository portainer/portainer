package kubernetes

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/pendingactions/actions"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
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

	upstream := newUpstream(t, http.StatusOK)

	request, err := http.NewRequest(http.MethodDelete, upstream.URL, nil)
	require.NoError(t, err)

	transport := &baseTransport{
		httpTransport: &http.Transport{},
		tokenManager:  &tokenManager{kubecli: &recordingKubeClient{KubeClient: testhelpers.NewKubernetesClient()}},
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

const (
	deletedNamespace = "my-namespace"
	otherNamespace   = "other-namespace"
)

type recordingKubeClient struct {
	portainer.KubeClient
	deletedAccessPolicyNamespaces []string
	deleteAccessPolicyErr         error
	namespace                     portainer.K8sNamespaceInfo
	namespaceErr                  error
}

func (kcl *recordingKubeClient) GetNamespace(string) (portainer.K8sNamespaceInfo, error) {
	return kcl.namespace, kcl.namespaceErr
}

func (kcl *recordingKubeClient) NamespaceAccessPoliciesDeleteNamespace(ns string) error {
	kcl.deletedAccessPolicyNamespaces = append(kcl.deletedAccessPolicyNamespaces, ns)

	return kcl.deleteAccessPolicyErr
}

func newUpstream(t *testing.T, status int) *httptest.Server {
	t.Helper()

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(status)
	}))
	t.Cleanup(upstream.Close)

	return upstream
}

// seedNamespaceRecords creates a stack and a registry binding for the deleted namespace,
// alongside a registry binding for another namespace that must never be touched
func seedNamespaceRecords(t *testing.T, store dataservices.DataStore) (*portainer.Stack, *portainer.Registry) {
	t.Helper()

	stack := &portainer.Stack{ID: 1, Namespace: deletedNamespace, EndpointID: 1}
	registry := &portainer.Registry{
		RegistryAccesses: portainer.RegistryAccesses{
			1: {Namespaces: []string{deletedNamespace, otherNamespace}},
		},
	}

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.Stack().Create(stack); err != nil {
			return err
		}

		return tx.Registry().Create(registry)
	}))

	return stack, registry
}

// A namespace deletion that Kubernetes rejects must not touch any Portainer records
func TestProxyNamespaceDeleteOperation_KubernetesRejects_KeepsPortainerRecords(t *testing.T) {
	t.Parallel()

	for _, status := range []int{http.StatusForbidden, http.StatusNotFound} {
		t.Run(http.StatusText(status), func(t *testing.T) {
			t.Parallel()
			_, store := datastore.MustNewTestStore(t, true, false)
			stack, registry := seedNamespaceRecords(t, store)

			upstream := newUpstream(t, status)
			request, err := http.NewRequest(http.MethodDelete, upstream.URL, nil)
			require.NoError(t, err)

			kcl := &recordingKubeClient{KubeClient: testhelpers.NewKubernetesClient()}
			transport := &baseTransport{
				httpTransport: &http.Transport{},
				tokenManager:  &tokenManager{kubecli: kcl},
				endpoint:      &portainer.Endpoint{ID: 1},
				dataStore:     store,
			}

			resp, err := transport.proxyNamespaceDeleteOperation(request, deletedNamespace)
			require.NoError(t, err)
			require.Equal(t, status, resp.StatusCode, "the Kubernetes response should be passed through")
			require.NoError(t, resp.Body.Close())

			_, err = store.Stack().Read(stack.ID)
			require.NoError(t, err, "stack should survive a rejected namespace deletion")

			storedRegistry, err := store.Registry().Read(registry.ID)
			require.NoError(t, err)
			require.Equal(t, []string{deletedNamespace, otherNamespace}, storedRegistry.RegistryAccesses[1].Namespaces)

			require.Empty(t, kcl.deletedAccessPolicyNamespaces, "namespace access policy should survive a rejected namespace deletion")
		})
	}
}

// Kubernetes answers 202 Accepted while the namespace is terminating, which still counts as a deletion
func TestProxyNamespaceDeleteOperation_KubernetesAccepts_RemovesPortainerRecords(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)
	stack, registry := seedNamespaceRecords(t, store)

	upstream := newUpstream(t, http.StatusAccepted)
	request, err := http.NewRequest(http.MethodDelete, upstream.URL, nil)
	require.NoError(t, err)

	kcl := &recordingKubeClient{KubeClient: testhelpers.NewKubernetesClient()}
	transport := &baseTransport{
		httpTransport: &http.Transport{},
		tokenManager:  &tokenManager{kubecli: kcl},
		endpoint:      &portainer.Endpoint{ID: 1},
		dataStore:     store,
	}

	resp, err := transport.proxyNamespaceDeleteOperation(request, deletedNamespace)
	require.NoError(t, err)
	require.Equal(t, http.StatusAccepted, resp.StatusCode)
	require.NoError(t, resp.Body.Close())

	_, err = store.Stack().Read(stack.ID)
	require.True(t, store.IsErrObjectNotFound(err), "stack should be deleted")

	storedRegistry, err := store.Registry().Read(registry.ID)
	require.NoError(t, err)
	require.Equal(t, []string{otherNamespace}, storedRegistry.RegistryAccesses[1].Namespaces)

	require.Equal(t, []string{deletedNamespace}, kcl.deletedAccessPolicyNamespaces)
}

// Deleting the namespace again would only get a 404 from Kubernetes, so a cleanup failure after the
// deletion is queued as a pending action to be retried instead of being lost
func TestProxyNamespaceDeleteOperation_CleanupFails_QueuesCleanup(t *testing.T) {
	t.Parallel()

	lookups := []struct {
		name        string
		info        portainer.K8sNamespaceInfo
		err         error
		expectedUID string
	}{
		{name: "namespace read before deletion", info: portainer.K8sNamespaceInfo{Id: "namespace-uid"}, expectedUID: "namespace-uid"},
		{name: "namespace already gone", err: k8serrors.NewNotFound(corev1.Resource("namespaces"), "staging")},
		{name: "namespace lookup fails", err: errors.New("cluster unreachable")},
	}

	for _, lookup := range lookups {
		t.Run(lookup.name, func(t *testing.T) {
			t.Parallel()
			_, store := datastore.MustNewTestStore(t, true, false)

			kcl := &recordingKubeClient{
				KubeClient:            testhelpers.NewKubernetesClient(),
				deleteAccessPolicyErr: errors.New("configmap update failed"),
				namespace:             lookup.info,
				namespaceErr:          lookup.err,
			}

			// The namespace is recreated as soon as Kubernetes deletes it, so only a UID read
			// before the deletion identifies the deleted namespace
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				kcl.namespace = portainer.K8sNamespaceInfo{Id: "recreated-namespace-uid"}
				kcl.namespaceErr = nil
				w.WriteHeader(http.StatusOK)
			}))
			t.Cleanup(upstream.Close)

			request, err := http.NewRequest(http.MethodDelete, upstream.URL, nil)
			require.NoError(t, err)
			transport := &baseTransport{
				httpTransport: &http.Transport{},
				tokenManager:  &tokenManager{kubecli: kcl},
				endpoint:      &portainer.Endpoint{ID: 1},
				dataStore:     store,
			}

			resp, err := transport.proxyNamespaceDeleteOperation(request, deletedNamespace)
			require.NoError(t, err)
			require.Equal(t, http.StatusOK, resp.StatusCode, "the namespace was deleted, so the deletion is still reported as successful")
			require.NoError(t, resp.Body.Close())

			var queued []portainer.PendingAction
			require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
				queued, err = tx.PendingActions().ReadAll()

				return err
			}))
			require.Len(t, queued, 1)
			assert.Equal(t, actions.CleanupNamespaceRecords, queued[0].Action)
			assert.Equal(t, portainer.EndpointID(1), queued[0].EndpointID)

			var data struct{ NamespaceUID string }
			require.NoError(t, queued[0].UnmarshallActionData(&data))
			assert.Equal(t, lookup.expectedUID, data.NamespaceUID, "the UID tells the deleted namespace apart from a recreated one")
		})
	}
}

// A dry run is accepted by Kubernetes without deleting anything, so the namespace keeps its records
func TestProxyNamespaceDeleteOperation_DryRun_KeepsPortainerRecords(t *testing.T) {
	t.Parallel()

	for name, dryRun := range map[string]struct{ query, body string }{
		"query parameter": {query: "?dryRun=All"},
		"delete options":  {body: `{"kind":"DeleteOptions","apiVersion":"v1","dryRun":["All"]}`},
	} {
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			_, store := datastore.MustNewTestStore(t, true, false)
			stack, registry := seedNamespaceRecords(t, store)

			upstream := newUpstream(t, http.StatusOK)
			request, err := http.NewRequest(http.MethodDelete, upstream.URL+dryRun.query, strings.NewReader(dryRun.body))
			require.NoError(t, err)

			kcl := &recordingKubeClient{KubeClient: testhelpers.NewKubernetesClient()}
			transport := &baseTransport{
				httpTransport: &http.Transport{},
				tokenManager:  &tokenManager{kubecli: kcl},
				endpoint:      &portainer.Endpoint{ID: 1},
				dataStore:     store,
			}

			resp, err := transport.proxyNamespaceDeleteOperation(request, deletedNamespace)
			require.NoError(t, err)
			require.Equal(t, http.StatusOK, resp.StatusCode)
			require.NoError(t, resp.Body.Close())

			require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
				_, err := tx.Stack().Read(stack.ID)
				require.NoError(t, err, "stack should survive a dry-run deletion")

				storedRegistry, err := tx.Registry().Read(registry.ID)
				require.NoError(t, err)
				assert.Equal(t, []string{deletedNamespace, otherNamespace}, storedRegistry.RegistryAccesses[1].Namespaces)

				return nil
			}))
			assert.Empty(t, kcl.deletedAccessPolicyNamespaces, "namespace access policy should survive a dry-run deletion")
		})
	}
}

func TestIsDryRun(t *testing.T) {
	t.Parallel()

	for name, tc := range map[string]struct {
		query    string
		body     string
		expected bool
	}{
		"no options":             {},
		"query parameter":        {query: "?dryRun=All", expected: true},
		"delete options dry run": {body: `{"dryRun":["All"]}`, expected: true},
		"delete options":         {body: `{"propagationPolicy":"Background"}`},
		"undecodable body":       {body: "not json"},
	} {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			request, err := http.NewRequest(http.MethodDelete, "https://kubernetes"+tc.query, strings.NewReader(tc.body))
			require.NoError(t, err)

			dryRun, err := isDryRun(request)
			require.NoError(t, err)
			assert.Equal(t, tc.expected, dryRun)

			forwardedBody, err := io.ReadAll(request.Body)
			require.NoError(t, err)
			assert.Equal(t, tc.body, string(forwardedBody), "the body should still be forwarded to Kubernetes")
		})
	}
}
