package client

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/portainer/portainer/pkg/testhelpers"

	"github.com/stretchr/testify/require"
)

func TestHttpClient(t *testing.T) {
	t.Parallel()
	fips.InitFIPS(false)

	// Valid TLS configuration
	endpoint := &portainer.Endpoint{}
	endpoint.TLSConfig = portainer.TLSConfiguration{TLS: true}

	cli, err := httpClient(endpoint, nil)
	require.NoError(t, err)
	require.NotNil(t, cli)

	// Invalid TLS configuration
	endpoint.TLSConfig.TLSCertPath = "/invalid/path/client.crt"
	endpoint.TLSConfig.TLSKeyPath = "/invalid/path/client.key"

	cli, err = httpClient(endpoint, nil)
	require.Error(t, err)
	require.Nil(t, cli)
}

func TestAgentClientHeaders_SignsOnlyOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		fipsMode   bool
		nodeName   string
		wantSigned bool
	}{
		{name: "signs outside FIPS mode", fipsMode: false, wantSigned: true},
		{name: "omits the signature in FIPS mode", fipsMode: true, wantSigned: false},
		{name: "signs outside FIPS mode with a node name", fipsMode: false, nodeName: "node-1", wantSigned: true},
		{name: "omits the signature in FIPS mode with a node name", fipsMode: true, nodeName: "node-1", wantSigned: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			headers, err := agentClientHeaders(testhelpers.NewStubSignatureService(), test.nodeName, test.fipsMode)
			require.NoError(t, err)

			if test.wantSigned {
				require.Equal(t, testhelpers.StubPublicKey, headers[portainer.PortainerAgentPublicKeyHeader])
				require.Equal(t, testhelpers.StubSignature, headers[portainer.PortainerAgentSignatureHeader])
			} else {
				require.NotContains(t, headers, portainer.PortainerAgentPublicKeyHeader)
				require.NotContains(t, headers, portainer.PortainerAgentSignatureHeader)
			}

			// The target header selects a node in an agent cluster and is
			// unrelated to the signature, so it must survive FIPS mode.
			if test.nodeName == "" {
				require.NotContains(t, headers, portainer.PortainerAgentTargetHeader)
			} else {
				require.Equal(t, test.nodeName, headers[portainer.PortainerAgentTargetHeader])
			}
		})
	}
}

// In FIPS mode the signature must never be computed, not merely dropped after the
// fact, so a signature service that always fails must still yield headers.
func TestAgentClientHeaders_FIPSModeNeverCreatesSignature(t *testing.T) {
	t.Parallel()

	headers, err := agentClientHeaders(testhelpers.NewFailingSignatureService(), "node-1", true)
	require.NoError(t, err)
	require.Equal(t, map[string]string{portainer.PortainerAgentTargetHeader: "node-1"}, headers)
}

func TestAgentClientHeaders_SignatureFailurePropagatesOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	headers, err := agentClientHeaders(testhelpers.NewFailingSignatureService(), "", false)
	require.Error(t, err)
	require.Nil(t, headers)
}
