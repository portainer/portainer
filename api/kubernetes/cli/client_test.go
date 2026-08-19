package cli

import (
	"os"
	"testing"

	"github.com/portainer/portainer/api/filesystem"
	"github.com/stretchr/testify/require"
	"k8s.io/client-go/rest"
)

func TestClearUserClientCache(t *testing.T) {
	t.Parallel()
	factory, _ := NewClientFactory(nil, nil, nil, "", "", "")
	kcl := &KubeClient{}
	factory.endpointProxyClients.Set("12.1", kcl, 0)
	factory.endpointProxyClients.Set("12.12", kcl, 0)
	factory.endpointProxyClients.Set("12", kcl, 0)

	factory.ClearUserClientCache("12")

	if len(factory.endpointProxyClients.Items()) != 2 {
		t.Errorf("Incorrect clients cached after clearUserClientCache;\ngot=\n%d\nwant=\n%d", len(factory.endpointProxyClients.Items()), 2)
	}
	if _, ok := factory.GetProxyKubeClient("12", "12"); ok {
		t.Errorf("Expected not to find client cache for user after clear")
	}
}

func TestBuildLocalRestConfig(t *testing.T) {
	t.Run("uses the kubeconfig at DEV_KUBECONFIG_PATH when set", func(t *testing.T) {
		kubeconfigPath := filesystem.JoinPaths(t.TempDir(), "kubeconfig")
		require.NoError(t, os.WriteFile(kubeconfigPath, []byte(`
apiVersion: v1
kind: Config
clusters:
- name: local
  cluster:
    server: https://127.0.0.1:26443
    insecure-skip-tls-verify: true
contexts:
- name: local
  context:
    cluster: local
    user: local
current-context: local
users:
- name: local
  user:
    token: fake-token
`), 0o600))
		t.Setenv("DEV_KUBECONFIG_PATH", kubeconfigPath)

		config, err := buildLocalRestConfig()
		require.NoError(t, err)
		require.Equal(t, "https://127.0.0.1:26443", config.Host)
	})

	t.Run("falls back to the in-cluster config when unset", func(t *testing.T) {
		t.Setenv("DEV_KUBECONFIG_PATH", "")
		t.Setenv("KUBERNETES_SERVICE_HOST", "")
		t.Setenv("KUBERNETES_SERVICE_PORT", "")

		_, err := buildLocalRestConfig()
		require.ErrorIs(t, err, rest.ErrNotInCluster)
	})
}
