package handlers

import (
	"encoding/json"
	"fmt"
	"testing"

	portainer "github.com/portainer/portainer/api"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// buildPendingAction creates a PendingAction with ActionData serialized as a
// JSON string — matching the format UnmarshallActionData expects (string type assertion).
func buildPendingAction(endpointID portainer.EndpointID, registryID portainer.RegistryID, namespaces []string) portainer.PendingAction {
	data := deleteK8sRegistrySecretsData{
		RegistryID: registryID,
		Namespaces: namespaces,
	}
	raw, _ := json.Marshal(data)
	return portainer.PendingAction{
		EndpointID: endpointID,
		ActionData: string(raw),
	}
}

func TestHandlerDeleteK8sRegistrySecrets_Execute(t *testing.T) {
	t.Parallel()
	const endpointID portainer.EndpointID = 1
	const registryID portainer.RegistryID = 3

	endpoint := &portainer.Endpoint{ID: endpointID, Name: "test-env", Type: portainer.AgentOnKubernetesEnvironment}

	t.Run("nil endpoint - returns nil without error", func(t *testing.T) {
		factory := kubecli.NewTestClientFactory(endpointID, kubecli.NewTestKubeClient(kfake.NewSimpleClientset()))
		h := NewHandlerDeleteRegistrySecrets(nil, nil, factory)
		pa := buildPendingAction(endpointID, registryID, []string{"ns-a"})
		err := h.Execute(pa, nil)
		require.NoError(t, err)
	})

	t.Run("nil action data - returns nil without error", func(t *testing.T) {
		factory := kubecli.NewTestClientFactory(endpointID, kubecli.NewTestKubeClient(kfake.NewSimpleClientset()))
		h := NewHandlerDeleteRegistrySecrets(nil, nil, factory)
		pa := portainer.PendingAction{EndpointID: endpointID, ActionData: nil}
		err := h.Execute(pa, endpoint)
		require.NoError(t, err)
	})

	t.Run("malformed action data - returns unmarshal error", func(t *testing.T) {
		factory := kubecli.NewTestClientFactory(endpointID, kubecli.NewTestKubeClient(kfake.NewSimpleClientset()))
		h := NewHandlerDeleteRegistrySecrets(nil, nil, factory)
		pa := portainer.PendingAction{
			EndpointID: endpointID,
			ActionData: "{invalid json",
		}
		err := h.Execute(pa, endpoint)
		require.Error(t, err)
	})

	t.Run("kube factory has no client for endpoint - returns error", func(t *testing.T) {
		emptyFactory, err := kubecli.NewClientFactory(nil, nil, nil, "test", "", "")
		require.NoError(t, err)

		h := NewHandlerDeleteRegistrySecrets(nil, nil, emptyFactory)
		pa := buildPendingAction(endpointID, registryID, []string{"ns-a"})
		localEndpoint := &portainer.Endpoint{
			ID:   endpointID,
			Name: "test-env",
			Type: portainer.KubernetesLocalEnvironment,
		}
		execErr := h.Execute(pa, localEndpoint)
		assert.Error(t, execErr, "should return error when kube client cannot be obtained")
	})

	t.Run("all namespaces succeed - returns no error", func(t *testing.T) {
		secretName := fmt.Sprintf("registry-%d", registryID)

		saA := &v1.ServiceAccount{
			ObjectMeta:       metav1.ObjectMeta{Name: "default", Namespace: "ns-a"},
			ImagePullSecrets: []v1.LocalObjectReference{{Name: secretName}},
		}
		saB := &v1.ServiceAccount{
			ObjectMeta:       metav1.ObjectMeta{Name: "default", Namespace: "ns-b"},
			ImagePullSecrets: []v1.LocalObjectReference{{Name: secretName}},
		}
		secretA := &v1.Secret{ObjectMeta: metav1.ObjectMeta{Name: secretName, Namespace: "ns-a"}}
		secretB := &v1.Secret{ObjectMeta: metav1.ObjectMeta{Name: secretName, Namespace: "ns-b"}}

		fakeK8s := kfake.NewSimpleClientset(saA, saB, secretA, secretB)
		factory := kubecli.NewTestClientFactory(endpointID, kubecli.NewTestKubeClient(fakeK8s))
		h := NewHandlerDeleteRegistrySecrets(nil, nil, factory)
		pa := buildPendingAction(endpointID, registryID, []string{"ns-a", "ns-b"})

		err := h.Execute(pa, endpoint)
		require.NoError(t, err)
	})

	t.Run("SA not found is idempotent - Execute succeeds", func(t *testing.T) {
		secretName := fmt.Sprintf("registry-%d", registryID)
		secretA := &v1.Secret{ObjectMeta: metav1.ObjectMeta{Name: secretName, Namespace: "ns-a"}}
		// No SA present; RemoveImagePullSecretFromServiceAccount treats not-found as idempotent
		fakeK8s := kfake.NewSimpleClientset(secretA)
		factory := kubecli.NewTestClientFactory(endpointID, kubecli.NewTestKubeClient(fakeK8s))
		h := NewHandlerDeleteRegistrySecrets(nil, nil, factory)
		pa := buildPendingAction(endpointID, registryID, []string{"ns-a"})

		err := h.Execute(pa, endpoint)
		require.NoError(t, err, "missing SA should be treated as idempotent")
	})

	t.Run("empty namespaces list - Execute succeeds with no operations", func(t *testing.T) {
		fakeK8s := kfake.NewSimpleClientset()
		factory := kubecli.NewTestClientFactory(endpointID, kubecli.NewTestKubeClient(fakeK8s))
		h := NewHandlerDeleteRegistrySecrets(nil, nil, factory)
		pa := buildPendingAction(endpointID, registryID, []string{})

		err := h.Execute(pa, endpoint)
		require.NoError(t, err)
	})
}
