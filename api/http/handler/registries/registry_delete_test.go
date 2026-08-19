package registries

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/pendingactions"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// spyKubeClient for registry delete tests - same pattern as endpoint_registry_access_test.go
type deleteSpyKubeClient struct {
	portainer.KubeClient

	deleteSecretErrors     map[string]error
	removePullSecretErrors map[string]error

	deletedSecrets     []string
	removedPullSecrets []string
}

func newDeleteSpy() *deleteSpyKubeClient {
	return &deleteSpyKubeClient{
		deleteSecretErrors:     make(map[string]error),
		removePullSecretErrors: make(map[string]error),
	}
}

func (s *deleteSpyKubeClient) DeleteRegistrySecret(_ portainer.RegistryID, namespace string) error {
	s.deletedSecrets = append(s.deletedSecrets, namespace)
	return s.deleteSecretErrors[namespace]
}

func (s *deleteSpyKubeClient) RemoveImagePullSecretFromServiceAccount(namespace, _, _ string) error {
	s.removedPullSecrets = append(s.removedPullSecrets, namespace)
	return s.removePullSecretErrors[namespace]
}

func newTestHandler(t *testing.T) (*Handler, dataservices.DataStore) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, false, false)
	require.NotNil(t, store)

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	return handler, store
}

// --- cleanupRegistryFromNamespaces unit tests ---

func TestCleanupRegistryFromNamespaces(t *testing.T) {
	t.Parallel()
	const registryID portainer.RegistryID = 3
	const endpointID portainer.EndpointID = 1

	t.Run("all namespaces succeed - returns empty failed list", func(t *testing.T) {
		spy := newDeleteSpy()
		failed := cleanupRegistryFromNamespaces(spy, registryID, []string{"ns-a", "ns-b"}, endpointID)
		assert.Empty(t, failed)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.removedPullSecrets)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.deletedSecrets)
	})

	t.Run("SA removal fails - namespace in failed list and secret not deleted", func(t *testing.T) {
		spy := newDeleteSpy()
		spy.removePullSecretErrors["ns-a"] = errors.New("sa error")
		failed := cleanupRegistryFromNamespaces(spy, registryID, []string{"ns-a", "ns-b"}, endpointID)
		assert.Equal(t, []string{"ns-a"}, failed)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.removedPullSecrets)
		assert.Equal(t, []string{"ns-b"}, spy.deletedSecrets, "ns-a secret must not be deleted when SA removal fails")
	})

	t.Run("secret deletion fails - namespace in failed list", func(t *testing.T) {
		spy := newDeleteSpy()
		spy.deleteSecretErrors["ns-a"] = errors.New("delete error")
		failed := cleanupRegistryFromNamespaces(spy, registryID, []string{"ns-a", "ns-b"}, endpointID)
		assert.Equal(t, []string{"ns-a"}, failed)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.removedPullSecrets)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.deletedSecrets)
	})

	t.Run("both operations fail for all namespaces - all in failed list", func(t *testing.T) {
		spy := newDeleteSpy()
		spy.removePullSecretErrors["ns-a"] = errors.New("err")
		spy.removePullSecretErrors["ns-b"] = errors.New("err")
		failed := cleanupRegistryFromNamespaces(spy, registryID, []string{"ns-a", "ns-b"}, endpointID)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, failed)
		assert.Empty(t, spy.deletedSecrets)
	})

	t.Run("empty namespace list - returns empty failed list", func(t *testing.T) {
		spy := newDeleteSpy()
		failed := cleanupRegistryFromNamespaces(spy, registryID, []string{}, endpointID)
		assert.Empty(t, failed)
		assert.Empty(t, spy.removedPullSecrets)
		assert.Empty(t, spy.deletedSecrets)
	})
}

// --- deleteKubernetesSecrets integration tests ---

func TestDeleteKubernetesSecrets(t *testing.T) {
	t.Parallel()
	const registryID portainer.RegistryID = 3
	const endpointID portainer.EndpointID = 1

	newHandlerWithFakeK8s := func(t *testing.T, endpoint *portainer.Endpoint, registry *portainer.Registry) (*Handler, *datastore.Store) {
		t.Helper()
		_, store := datastore.MustNewTestStore(t, true, false)

		require.NoError(t, store.Endpoint().Create(endpoint))
		require.NoError(t, store.Registry().Create(registry))

		defaultSA := &v1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{Name: "default", Namespace: "ns-a"},
		}
		fakeK8s := kfake.NewSimpleClientset(defaultSA)
		factory := kubecli.NewTestClientFactory(endpointID, kubecli.NewTestKubeClient(fakeK8s))
		pas := pendingactions.NewService(store, nil)

		h := &Handler{
			DataStore:             store,
			K8sClientFactory:      factory,
			PendingActionsService: pas,
			requestBouncer:        testhelpers.NewTestRequestBouncer(),
		}
		return h, store
	}

	t.Run("GetPrivilegedKubeClient fails - no pending action created", func(t *testing.T) {
		// KubernetesLocalEnvironment calls rest.InClusterConfig() which fails outside
		// a real cluster, causing GetPrivilegedKubeClient to return an error gracefully.
		endpoint := &portainer.Endpoint{
			ID:   endpointID,
			Name: "test-env",
			Type: portainer.KubernetesLocalEnvironment,
		}
		registry := &portainer.Registry{
			ID: registryID,
			RegistryAccesses: portainer.RegistryAccesses{
				endpointID: portainer.RegistryAccessPolicies{Namespaces: []string{"ns-a"}},
			},
		}
		_, store := datastore.MustNewTestStore(t, true, false)
		require.NoError(t, store.Endpoint().Create(endpoint))
		require.NoError(t, store.Registry().Create(registry))

		// Empty factory: endpoint not in cache, CreateConfig will fail → returns error, not panic
		emptyFactory, err := kubecli.NewClientFactory(nil, nil, nil, "test", "", "")
		require.NoError(t, err)

		pas := pendingactions.NewService(store, nil)
		h := &Handler{
			DataStore:             store,
			K8sClientFactory:      emptyFactory,
			PendingActionsService: pas,
			requestBouncer:        testhelpers.NewTestRequestBouncer(),
		}

		h.deleteKubernetesSecrets(store, registry)

		actions, err := store.PendingActions().ReadAll(func(portainer.PendingAction) bool { return true })
		require.NoError(t, err)
		assert.Empty(t, actions, "no pending action should be created when kube client cannot be obtained")
	})

	t.Run("all namespaces succeed - no pending action created", func(t *testing.T) {
		endpoint := &portainer.Endpoint{
			ID:   endpointID,
			Name: "test-env",
			Type: portainer.AgentOnKubernetesEnvironment,
		}
		registry := &portainer.Registry{
			ID: registryID,
			RegistryAccesses: portainer.RegistryAccesses{
				endpointID: portainer.RegistryAccessPolicies{Namespaces: []string{"ns-a"}},
			},
		}
		_, store := datastore.MustNewTestStore(t, true, false)
		require.NoError(t, store.Endpoint().Create(endpoint))
		require.NoError(t, store.Registry().Create(registry))

		defaultSA := &v1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{Name: "default", Namespace: "ns-a"},
		}
		fakeK8s := kfake.NewSimpleClientset(defaultSA)
		factory := kubecli.NewTestClientFactory(endpointID, kubecli.NewTestKubeClient(fakeK8s))
		pas := pendingactions.NewService(store, nil)
		h := &Handler{
			DataStore:             store,
			K8sClientFactory:      factory,
			PendingActionsService: pas,
			requestBouncer:        testhelpers.NewTestRequestBouncer(),
		}

		h.deleteKubernetesSecrets(store, registry)

		actions, err := store.PendingActions().ReadAll(func(portainer.PendingAction) bool { return true })
		require.NoError(t, err)
		assert.Empty(t, actions)
	})

	t.Run("registry with no Kubernetes namespaces - no operations attempted", func(t *testing.T) {
		endpoint := &portainer.Endpoint{
			ID:   endpointID,
			Name: "test-env",
			Type: portainer.AgentOnKubernetesEnvironment,
		}
		registry := &portainer.Registry{
			ID: registryID,
			RegistryAccesses: portainer.RegistryAccesses{
				endpointID: portainer.RegistryAccessPolicies{Namespaces: nil},
			},
		}
		h, store := newHandlerWithFakeK8s(t, endpoint, registry)

		h.deleteKubernetesSecrets(store, registry)

		actions, err := store.PendingActions().ReadAll(func(portainer.PendingAction) bool { return true })
		require.NoError(t, err)
		assert.Empty(t, actions)
	})
}
