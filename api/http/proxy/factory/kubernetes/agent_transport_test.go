package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/pkg/testhelpers"

	"github.com/stretchr/testify/require"
)

// recordingReverseTunnelService records calls to UpdateLastActivity so tests can
// assert whether the Edge keep-alive path fired.
type recordingReverseTunnelService struct {
	portainer.ReverseTunnelService
	updateLastActivityCalls []portainer.EndpointID
}

func (s *recordingReverseTunnelService) UpdateLastActivity(endpointID portainer.EndpointID) {
	s.updateLastActivityCalls = append(s.updateLastActivityCalls, endpointID)
}

// newTestAgentTransport builds an agentTransport directly rather than through
// NewAgentTransport, which wraps its round tripper in SSRF protections that
// reject the loopback address httptest serves on.
func newTestAgentTransport(t *testing.T, signatureService portainer.DigitalSignatureService) *agentTransport {
	t.Helper()

	endpoint := &portainer.Endpoint{ID: 1}

	return &agentTransport{
		signatureService: signatureService,
		baseTransport:    newBaseTransport(&http.Transport{}, &tokenManager{}, endpoint, nil, nil, nil),
	}
}

// newAdminRequest builds a request carrying admin token data, which
// getRoundTripToken needs before the transport reaches the signing step.
func newAdminRequest(t *testing.T, url string) *http.Request {
	t.Helper()

	request := httptest.NewRequest(http.MethodGet, url, nil)
	request.RequestURI = ""

	return request.WithContext(security.StoreTokenData(request, &portainer.TokenData{
		ID:       1,
		Username: "admin",
		Role:     portainer.AdministratorRole,
	}))
}

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

func TestAgentTransport_roundTrip_SignsOnlyOutsideFIPSMode(t *testing.T) {
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

			transport := newTestAgentTransport(t, testhelpers.NewSignatureService(t))
			request := newAdminRequest(t, server.URL+"/namespaces")

			resp, err := transport.roundTrip(request, test.fipsMode)
			require.NoError(t, err)
			require.NoError(t, resp.Body.Close())

			assertAgentSignatureHeaders(t, capturedHeaders, test.wantSigned)
			// The Kubernetes service account token is unrelated to the signature
			// and must be sent in both modes.
			require.Contains(t, capturedHeaders, http.CanonicalHeaderKey(portainer.PortainerAgentKubernetesSATokenHeader))
		})
	}
}

// In FIPS mode the signature must never be computed, not merely dropped after the
// fact, so a signature service that always fails must not break the round trip.
func TestAgentTransport_roundTrip_FIPSModeNeverCreatesSignature(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	transport := newTestAgentTransport(t, testhelpers.NewFailingSignatureService())
	request := newAdminRequest(t, server.URL+"/namespaces")

	resp, err := transport.roundTrip(request, true)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

func TestAgentTransport_roundTrip_SignatureFailurePropagatesOutsideFIPSMode(t *testing.T) {
	t.Parallel()

	transport := newTestAgentTransport(t, testhelpers.NewFailingSignatureService())
	request := newAdminRequest(t, "http://example.com/namespaces")

	resp, err := transport.roundTrip(request, false)
	if resp != nil {
		require.NoError(t, resp.Body.Close())
	}

	require.ErrorContains(t, err, "signature failure")
}
