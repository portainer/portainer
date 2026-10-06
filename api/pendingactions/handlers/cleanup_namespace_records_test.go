package handlers

import (
	"context"
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	kfake "k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"
)

const (
	cleanupTestEndpointID portainer.EndpointID = 1
	deletedNamespace                           = "deleted-ns"
	otherNamespace                             = "other-ns"
	deletedNamespaceUID                        = "deleted-ns-uid"
	recreatedNamespaceUID                      = "recreated-ns-uid"
)

func namespace(uid string, phase corev1.NamespacePhase) *corev1.Namespace {
	return &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{Name: deletedNamespace, UID: types.UID(uid)},
		Status:     corev1.NamespaceStatus{Phase: phase},
	}
}

func TestHandlerCleanupNamespaceRecords_Execute(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name            string
		namespace       *corev1.Namespace
		queuedUID       string
		expectRetry     bool
		expectCleanedUp bool
	}{
		{
			name:            "namespace is gone",
			queuedUID:       deletedNamespaceUID,
			expectCleanedUp: true,
		},
		{
			name:            "deleted namespace is still in the Active phase",
			namespace:       namespace(deletedNamespaceUID, corev1.NamespaceActive),
			queuedUID:       deletedNamespaceUID,
			expectCleanedUp: true,
		},
		{
			name:            "deleted namespace is still terminating",
			namespace:       namespace(deletedNamespaceUID, corev1.NamespaceTerminating),
			queuedUID:       deletedNamespaceUID,
			expectCleanedUp: true,
		},
		{
			name:            "namespace was recreated",
			namespace:       namespace(recreatedNamespaceUID, corev1.NamespaceActive),
			queuedUID:       deletedNamespaceUID,
			expectCleanedUp: false,
		},
		{
			name:            "unknown deleted namespace is gone",
			expectCleanedUp: true,
		},
		{
			name:        "unknown deleted namespace still exists",
			namespace:   namespace(deletedNamespaceUID, corev1.NamespaceTerminating),
			expectRetry: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, store := datastore.MustNewTestStore(t, true, false)

			endpoint := &portainer.Endpoint{ID: cleanupTestEndpointID, Type: portainer.AgentOnKubernetesEnvironment}
			stack := &portainer.Stack{ID: 1, Namespace: deletedNamespace, EndpointID: cleanupTestEndpointID}
			require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
				return tx.Stack().Create(stack)
			}))

			objects := []runtime.Object{accessPoliciesConfigMap(t, deletedNamespace, otherNamespace)}
			if tt.namespace != nil {
				objects = append(objects, tt.namespace)
			}
			clientset := kfake.NewSimpleClientset(objects...)
			factory := kubecli.NewTestClientFactory(cleanupTestEndpointID, kubecli.NewTestKubeClient(clientset))

			action := queueAndReadBack(t, store, NewCleanupNamespaceRecords(cleanupTestEndpointID, deletedNamespace, tt.queuedUID))

			err := NewHandlerCleanupNamespaceRecords(store, factory).Execute(action, endpoint)
			if tt.expectRetry {
				require.Error(t, err, "the pending action must be kept to be retried")
			} else {
				require.NoError(t, err)
			}

			var stackErr error
			require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
				_, stackErr = tx.Stack().Read(stack.ID)

				return nil
			}))

			policies := readAccessPolicies(t, clientset)
			assert.Contains(t, policies, otherNamespace, "other namespaces must keep their access policies")

			if tt.expectCleanedUp {
				assert.True(t, store.IsErrObjectNotFound(stackErr), "stack should be deleted")
				assert.NotContains(t, policies, deletedNamespace)

				return
			}

			require.NoError(t, stackErr, "the stack must be kept")
			assert.Contains(t, policies, deletedNamespace)
		})
	}
}

func TestHandlerCleanupNamespaceRecords_Execute_Errors(t *testing.T) {
	t.Parallel()

	endpoint := &portainer.Endpoint{ID: cleanupTestEndpointID, Type: portainer.AgentOnKubernetesEnvironment}
	action := NewCleanupNamespaceRecords(cleanupTestEndpointID, deletedNamespace, deletedNamespaceUID)

	t.Run("malformed action data", func(t *testing.T) {
		t.Parallel()

		factory := kubecli.NewTestClientFactory(cleanupTestEndpointID, kubecli.NewTestKubeClient(kfake.NewSimpleClientset()))
		malformed := portainer.PendingAction{EndpointID: cleanupTestEndpointID, ActionData: "{invalid json"}

		require.Error(t, NewHandlerCleanupNamespaceRecords(nil, factory).Execute(malformed, endpoint))
	})

	t.Run("kube client unavailable", func(t *testing.T) {
		t.Parallel()

		factory := kubecli.NewTestClientFactory(cleanupTestEndpointID, kubecli.NewTestKubeClient(kfake.NewSimpleClientset()))
		unknownEndpoint := &portainer.Endpoint{ID: cleanupTestEndpointID + 1, Type: portainer.KubernetesLocalEnvironment}

		require.Error(t, NewHandlerCleanupNamespaceRecords(nil, factory).Execute(action, unknownEndpoint))
	})

	t.Run("namespace lookup fails", func(t *testing.T) {
		t.Parallel()

		clientset := kfake.NewSimpleClientset()
		clientset.PrependReactor("get", "namespaces", func(k8stesting.Action) (bool, runtime.Object, error) {
			return true, nil, errors.New("cluster unreachable")
		})
		factory := kubecli.NewTestClientFactory(cleanupTestEndpointID, kubecli.NewTestKubeClient(clientset))

		require.Error(t, NewHandlerCleanupNamespaceRecords(nil, factory).Execute(queueAndReadBackInNewStore(t, action), endpoint))
	})
}

func queueAndReadBackInNewStore(t *testing.T, action portainer.PendingAction) portainer.PendingAction {
	t.Helper()
	_, store := datastore.MustNewTestStore(t, true, false)

	return queueAndReadBack(t, store, action)
}

func TestHandlerCleanupNamespaceRecords_Execute_NilEndpoint(t *testing.T) {
	t.Parallel()

	h := NewHandlerCleanupNamespaceRecords(nil, nil)

	require.NoError(t, h.Execute(NewCleanupNamespaceRecords(cleanupTestEndpointID, deletedNamespace, deletedNamespaceUID), nil))
}

// queueAndReadBack stores the action and reads it back, so its ActionData is in the serialized form
// the pending actions service hands to the handler
func queueAndReadBack(t *testing.T, store dataservices.DataStore, action portainer.PendingAction) portainer.PendingAction {
	t.Helper()

	var stored *portainer.PendingAction
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.PendingActions().Create(&action); err != nil {
			return err
		}

		var err error
		stored, err = tx.PendingActions().Read(action.ID)

		return err
	}))

	return *stored
}

func accessPoliciesConfigMap(t *testing.T, namespaces ...string) *corev1.ConfigMap {
	t.Helper()

	policies := map[string]portainer.K8sNamespaceAccessPolicy{}
	for _, ns := range namespaces {
		policies[ns] = portainer.K8sNamespaceAccessPolicy{UserAccessPolicies: portainer.UserAccessPolicies{2: {}}}
	}

	data, err := json.Marshal(policies)
	require.NoError(t, err)

	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "portainer-config", Namespace: "portainer"},
		Data:       map[string]string{"NamespaceAccessPolicies": string(data)},
	}
}

func readAccessPolicies(t *testing.T, clientset *kfake.Clientset) map[string]portainer.K8sNamespaceAccessPolicy {
	t.Helper()

	configMap, err := clientset.CoreV1().ConfigMaps("portainer").Get(context.Background(), "portainer-config", metav1.GetOptions{})
	require.NoError(t, err)

	policies := map[string]portainer.K8sNamespaceAccessPolicy{}
	require.NoError(t, json.Unmarshal([]byte(configMap.Data["NamespaceAccessPolicies"]), &policies))

	return policies
}
