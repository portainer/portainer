package websocket

import (
	"net/http"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/testhelpers"

	"github.com/stretchr/testify/require"
)

func TestBuildAgentProxyDirector_SignsOnlyOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		fipsMode   bool
		wantSigned bool
	}{
		{name: "signs the handshake outside FIPS mode", fipsMode: false, wantSigned: true},
		{name: "omits the signature in FIPS mode", fipsMode: true, wantSigned: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			director, err := buildAgentProxyDirector(testhelpers.NewSignatureService(t), "node-1", "sa-token", test.fipsMode)
			require.NoError(t, err)
			require.NotNil(t, director)

			headers := http.Header{}
			director(nil, headers)

			if test.wantSigned {
				require.NotEmpty(t, headers.Get(portainer.PortainerAgentPublicKeyHeader))
				require.NotEmpty(t, headers.Get(portainer.PortainerAgentSignatureHeader))
			} else {
				require.Empty(t, headers.Get(portainer.PortainerAgentPublicKeyHeader))
				require.Empty(t, headers.Get(portainer.PortainerAgentSignatureHeader))
			}

			// The node target and service account token are unrelated to the
			// signature and must be sent in both modes.
			require.Equal(t, "node-1", headers.Get(portainer.PortainerAgentTargetHeader))
			require.Equal(t, "sa-token", headers.Get(portainer.PortainerAgentKubernetesSATokenHeader))
		})
	}
}

// In FIPS mode the signature must never be computed, not merely dropped after the
// fact, so a signature service that always fails must still yield a director.
func TestBuildAgentProxyDirector_FIPSModeNeverCreatesSignature(t *testing.T) {
	t.Parallel()

	director, err := buildAgentProxyDirector(testhelpers.NewFailingSignatureService(), "node-1", "sa-token", true)
	require.NoError(t, err)
	require.NotNil(t, director)

	headers := http.Header{}
	director(nil, headers)

	require.Empty(t, headers.Get(portainer.PortainerAgentPublicKeyHeader))
	require.Empty(t, headers.Get(portainer.PortainerAgentSignatureHeader))
}

func TestBuildAgentProxyDirector_SignatureFailurePropagatesOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	director, err := buildAgentProxyDirector(testhelpers.NewFailingSignatureService(), "node-1", "sa-token", false)
	require.ErrorContains(t, err, "signature failure")
	require.Nil(t, director)
}
