package registryutils_test

import (
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/registryutils"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"

	"github.com/stretchr/testify/require"
)

const testNamespace = "test-namespace"

func newEcrRegistryForNamespace(endpointID portainer.EndpointID, namespace string) *portainer.Registry {
	return &portainer.Registry{
		Type: portainer.EcrRegistry,
		Name: "ecr-registry",
		Ecr:  portainer.EcrData{Region: "us-east-1"},
		RegistryAccesses: portainer.RegistryAccesses{
			endpointID: portainer.RegistryAccessPolicies{
				Namespaces: []string{namespace},
			},
		},
		AccessToken:       "AWS:ecr-password",
		AccessTokenExpiry: time.Now().Add(time.Hour).Unix(),
	}
}

func TestRefreshEcrSecret_NoRegistries(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	kubeClient := kubecli.NewTestKubeClient(kfake.NewSimpleClientset())
	endpoint := &portainer.Endpoint{ID: 1}

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return registryutils.RefreshEcrSecret(tx, kubeClient, endpoint, testNamespace)
	})
	require.NoError(t, err)
}

func TestRefreshEcrSecret_NonEcrRegistryIgnored(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	endpoint := &portainer.Endpoint{ID: 1}

	reg := &portainer.Registry{
		Type: portainer.DockerHubRegistry,
		Name: "dockerhub-registry",
		RegistryAccesses: portainer.RegistryAccesses{
			endpoint.ID: portainer.RegistryAccessPolicies{
				Namespaces: []string{testNamespace},
			},
		},
	}
	require.NoError(t, store.Registry().Create(reg))

	fakeClientset := kfake.NewSimpleClientset()
	kubeClient := kubecli.NewTestKubeClient(fakeClientset)

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return registryutils.RefreshEcrSecret(tx, kubeClient, endpoint, testNamespace)
	})
	require.NoError(t, err)

	secretName := registryutils.RegistrySecretName(reg.ID)
	_, err = fakeClientset.CoreV1().Secrets(testNamespace).Get(t.Context(), secretName, metav1.GetOptions{})
	require.Error(t, err, "no secret should be created for a non-ECR registry")
}

func TestRefreshEcrSecret_RegistryNotAssignedToNamespaceIgnored(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	endpoint := &portainer.Endpoint{ID: 1}

	reg := newEcrRegistryForNamespace(endpoint.ID, "other-namespace")
	require.NoError(t, store.Registry().Create(reg))

	fakeClientset := kfake.NewSimpleClientset()
	kubeClient := kubecli.NewTestKubeClient(fakeClientset)

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return registryutils.RefreshEcrSecret(tx, kubeClient, endpoint, testNamespace)
	})
	require.NoError(t, err)

	secretName := registryutils.RegistrySecretName(reg.ID)
	_, err = fakeClientset.CoreV1().Secrets(testNamespace).Get(t.Context(), secretName, metav1.GetOptions{})
	require.Error(t, err, "no secret should be created for a registry not assigned to the namespace")
}

func TestRefreshEcrSecret_EcrRegistryAssigned_CreatesSecret(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	endpoint := &portainer.Endpoint{ID: 1}

	reg := newEcrRegistryForNamespace(endpoint.ID, testNamespace)
	require.NoError(t, store.Registry().Create(reg))

	fakeClientset := kfake.NewSimpleClientset()
	kubeClient := kubecli.NewTestKubeClient(fakeClientset)

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return registryutils.RefreshEcrSecret(tx, kubeClient, endpoint, testNamespace)
	})
	require.NoError(t, err)

	secretName := registryutils.RegistrySecretName(reg.ID)
	_, err = fakeClientset.CoreV1().Secrets(testNamespace).Get(t.Context(), secretName, metav1.GetOptions{})
	require.NoError(t, err, "secret should be created for an ECR registry assigned to the namespace")
}
