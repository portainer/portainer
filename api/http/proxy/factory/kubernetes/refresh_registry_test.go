package kubernetes

import (
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/registryutils"
	cli "github.com/portainer/portainer/api/kubernetes/cli"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"

	"github.com/stretchr/testify/require"
)

const refreshRegistryTestNamespace = "test-namespace"

func TestRefreshRegistry_NoPrivilegedKubeClient_ReturnsError(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	endpoint := &portainer.Endpoint{ID: 1}

	emptyFactory, err := cli.NewClientFactory(nil, nil, nil, "test", "", "")
	require.NoError(t, err)

	transport := &baseTransport{
		endpoint:         endpoint,
		k8sClientFactory: emptyFactory,
		dataStore:        store,
	}

	err = transport.refreshRegistry(nil, refreshRegistryTestNamespace)
	require.Error(t, err, "should return an error when a privileged kube client cannot be obtained")
}

func TestRefreshRegistry_CreatesEcrSecretThroughTx(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	endpoint := &portainer.Endpoint{ID: 1}

	reg := &portainer.Registry{
		Type: portainer.EcrRegistry,
		Name: "ecr-registry",
		Ecr:  portainer.EcrData{Region: "us-east-1"},
		RegistryAccesses: portainer.RegistryAccesses{
			endpoint.ID: portainer.RegistryAccessPolicies{
				Namespaces: []string{refreshRegistryTestNamespace},
			},
		},
		AccessToken:       "AWS:ecr-password",
		AccessTokenExpiry: time.Now().Add(time.Hour).Unix(),
	}
	require.NoError(t, store.Registry().Create(reg))

	fakeClientset := kfake.NewSimpleClientset()
	factory := cli.NewTestClientFactory(endpoint.ID, cli.NewTestKubeClient(fakeClientset))

	transport := &baseTransport{
		endpoint:         endpoint,
		k8sClientFactory: factory,
		dataStore:        store,
	}

	err := transport.refreshRegistry(nil, refreshRegistryTestNamespace)
	require.NoError(t, err)

	secretName := registryutils.RegistrySecretName(reg.ID)
	_, err = fakeClientset.CoreV1().Secrets(refreshRegistryTestNamespace).Get(t.Context(), secretName, metav1.GetOptions{})
	require.NoError(t, err, "secret should be created for the ECR registry assigned to the namespace")
}
