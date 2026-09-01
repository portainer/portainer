package agent

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/testhelpers"

	"github.com/stretchr/testify/require"
)

func assertAgentSignatureHeaders(t *testing.T, headers http.Header, wantSigned bool) {
	t.Helper()

	if !wantSigned {
		require.Empty(t, headers.Get(portainer.PortainerAgentPublicKeyHeader))
		require.Empty(t, headers.Get(portainer.PortainerAgentSignatureHeader))

		return
	}

	require.NotEmpty(t, headers.Get(portainer.PortainerAgentPublicKeyHeader))
	require.NotEmpty(t, headers.Get(portainer.PortainerAgentSignatureHeader))
}

func TestTransport_roundTrip_SignsOnlyOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		fipsMode   bool
		wantSigned bool
	}{
		{name: "signs the request outside FIPS mode", fipsMode: false, wantSigned: true},
		{name: "omits the signature in FIPS mode", fipsMode: true, wantSigned: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			var capturedHeaders http.Header
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				capturedHeaders = r.Header.Clone()
				w.WriteHeader(http.StatusOK)
			}))
			defer server.Close()

			transport := NewTransport(testhelpers.NewSignatureService(t), &http.Transport{})

			request := httptest.NewRequest(http.MethodGet, server.URL, nil)
			request.RequestURI = ""

			resp, err := transport.roundTrip(request, test.fipsMode)
			require.NoError(t, err)
			require.NoError(t, resp.Body.Close())

			assertAgentSignatureHeaders(t, capturedHeaders, test.wantSigned)
		})
	}
}

// In FIPS mode the signature must never be computed, not merely dropped after the
// fact, so a signature service that always fails must not break the round trip.
func TestTransport_roundTrip_FIPSModeNeverCreatesSignature(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	transport := NewTransport(testhelpers.NewFailingSignatureService(), &http.Transport{})

	request := httptest.NewRequest(http.MethodGet, server.URL, nil)
	request.RequestURI = ""

	resp, err := transport.roundTrip(request, true)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

func TestTransport_roundTrip_SignatureFailurePropagatesOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	transport := NewTransport(testhelpers.NewFailingSignatureService(), &http.Transport{})

	request := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
	request.RequestURI = ""

	resp, err := transport.roundTrip(request, false)
	if resp != nil {
		require.NoError(t, resp.Body.Close())
	}

	require.ErrorContains(t, err, "signature failure")
}
