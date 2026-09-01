package cli

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/testhelpers"
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

// stubReverseTunnelService resolves the tunnel address buildEdgeConfig needs.
type stubReverseTunnelService struct {
	portainer.ReverseTunnelService
}

func (s *stubReverseTunnelService) TunnelAddr(endpoint *portainer.Endpoint) (string, error) {
	return "127.0.0.1:8000", nil
}

// recordingRoundTripper captures the headers the wrapped transport was handed.
type recordingRoundTripper struct {
	headers http.Header
}

func (rt *recordingRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	rt.headers = req.Header.Clone()

	return &http.Response{StatusCode: http.StatusOK, Body: http.NoBody}, nil
}

// assertConfigSigning runs the config's transport wrapper, if any, and checks
// whether the agent headers were added.
func assertConfigSigning(t *testing.T, config *rest.Config, wantSigned bool) {
	t.Helper()

	if !wantSigned {
		require.Nil(t, config.WrapTransport, "expected no transport wrapper in FIPS mode")

		return
	}

	require.NotNil(t, config.WrapTransport)

	recorder := &recordingRoundTripper{}
	request := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
	request.RequestURI = ""

	resp, err := config.WrapTransport(recorder).RoundTrip(request)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())

	require.Equal(t, testhelpers.StubPublicKey, recorder.headers.Get(portainer.PortainerAgentPublicKeyHeader))
	require.Equal(t, testhelpers.StubSignature, recorder.headers.Get(portainer.PortainerAgentSignatureHeader))
}

func TestClientFactory_buildAgentConfig_SignsOnlyOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		fipsMode   bool
		wantSigned bool
	}{
		{name: "wraps the transport outside FIPS mode", fipsMode: false, wantSigned: true},
		{name: "leaves the transport unwrapped in FIPS mode", fipsMode: true, wantSigned: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			factory, err := NewClientFactory(testhelpers.NewStubSignatureService(), nil, nil, "", "", "")
			require.NoError(t, err)

			config, err := factory.buildAgentConfig(&portainer.Endpoint{ID: 1, URL: "agent.example.com:9001"}, test.fipsMode)
			require.NoError(t, err)

			assertConfigSigning(t, config, test.wantSigned)
		})
	}
}

func TestClientFactory_buildEdgeConfig_SignsOnlyOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		fipsMode   bool
		wantSigned bool
	}{
		{name: "wraps the transport outside FIPS mode", fipsMode: false, wantSigned: true},
		{name: "leaves the transport unwrapped in FIPS mode", fipsMode: true, wantSigned: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			factory, err := NewClientFactory(testhelpers.NewStubSignatureService(), &stubReverseTunnelService{}, nil, "", "", "")
			require.NoError(t, err)

			config, err := factory.buildEdgeConfig(&portainer.Endpoint{ID: 1}, test.fipsMode)
			require.NoError(t, err)

			assertConfigSigning(t, config, test.wantSigned)
		})
	}
}

// In FIPS mode the signature must never be computed, not merely dropped after the
// fact, so a signature service that always fails must still yield a config.
func TestClientFactory_buildConfigs_FIPSModeNeverCreatesSignature(t *testing.T) {
	t.Parallel()

	factory, err := NewClientFactory(testhelpers.NewFailingSignatureService(), &stubReverseTunnelService{}, nil, "", "", "")
	require.NoError(t, err)

	agentConfig, err := factory.buildAgentConfig(&portainer.Endpoint{ID: 1, URL: "agent.example.com:9001"}, true)
	require.NoError(t, err)
	require.Nil(t, agentConfig.WrapTransport)

	edgeConfig, err := factory.buildEdgeConfig(&portainer.Endpoint{ID: 1}, true)
	require.NoError(t, err)
	require.Nil(t, edgeConfig.WrapTransport)
}

func TestClientFactory_buildConfigs_SignatureFailurePropagatesOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	factory, err := NewClientFactory(testhelpers.NewFailingSignatureService(), &stubReverseTunnelService{}, nil, "", "", "")
	require.NoError(t, err)

	_, err = factory.buildAgentConfig(&portainer.Endpoint{ID: 1, URL: "agent.example.com:9001"}, false)
	require.ErrorContains(t, err, "signature failure")

	_, err = factory.buildEdgeConfig(&portainer.Endpoint{ID: 1}, false)
	require.ErrorContains(t, err, "signature failure")
}
