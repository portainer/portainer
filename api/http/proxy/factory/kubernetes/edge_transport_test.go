package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/testhelpers"

	"github.com/stretchr/testify/require"
)

func TestNewEdgeTransport(t *testing.T) {
	t.Parallel()

	transport := NewEdgeTransport(nil, nil, nil, nil, nil, nil, nil)
	require.NotNil(t, transport)
}

// newTestEdgeTransport builds an edgeTransport directly rather than through
// NewEdgeTransport, so the round tripper can be pointed at an httptest server.
func newTestEdgeTransport(t *testing.T, signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService) *edgeTransport {
	t.Helper()

	endpoint := &portainer.Endpoint{ID: 1}

	return &edgeTransport{
		signatureService:     signatureService,
		reverseTunnelService: reverseTunnelService,
		baseTransport:        newBaseTransport(&http.Transport{}, &tokenManager{}, endpoint, nil, nil, nil),
	}
}

func TestEdgeTransport_roundTrip_SignsOnlyOutsideFIPSMode(t *testing.T) {
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

			tunnelService := &recordingReverseTunnelService{}
			transport := newTestEdgeTransport(t, testhelpers.NewSignatureService(t), tunnelService)
			request := newAdminRequest(t, server.URL+"/namespaces")

			resp, err := transport.roundTrip(request, test.fipsMode)
			require.NoError(t, err)
			require.NoError(t, resp.Body.Close())

			assertAgentSignatureHeaders(t, capturedHeaders, test.wantSigned)
			// The Edge keep-alive is unrelated to the signature and must fire in
			// both modes.
			require.Equal(t, []portainer.EndpointID{1}, tunnelService.updateLastActivityCalls)
		})
	}
}

// In FIPS mode the signature must never be computed, not merely dropped after the
// fact, so a signature service that always fails must not break the round trip.
func TestEdgeTransport_roundTrip_FIPSModeNeverCreatesSignature(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	transport := newTestEdgeTransport(t, testhelpers.NewFailingSignatureService(), &recordingReverseTunnelService{})
	request := newAdminRequest(t, server.URL+"/namespaces")

	resp, err := transport.roundTrip(request, true)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

func TestEdgeTransport_roundTrip_SignatureFailurePropagatesOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	tunnelService := &recordingReverseTunnelService{}
	transport := newTestEdgeTransport(t, testhelpers.NewFailingSignatureService(), tunnelService)
	request := newAdminRequest(t, "http://example.com/namespaces")

	resp, err := transport.roundTrip(request, false)
	if resp != nil {
		require.NoError(t, resp.Body.Close())
	}

	require.ErrorContains(t, err, "signature failure")
	require.Empty(t, tunnelService.updateLastActivityCalls)
}
