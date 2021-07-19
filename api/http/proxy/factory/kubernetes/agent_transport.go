package kubernetes

import (
	"crypto/tls"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
)

type agentTransport struct {
	*baseTransport
	signatureService portainer.DigitalSignatureService
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewAgentTransport(dataStore portainer.DataStore, signatureService portainer.DigitalSignatureService, tlsConfig *tls.Config, tokenManager *tokenManager, endpoint *portainer.Endpoint) *agentTransport {
	transport := &agentTransport{
		signatureService: signatureService,
		baseTransport: newBaseTransport(
			&http.Transport{
				TLSClientConfig: tlsConfig,
			},
			tokenManager,
			endpoint,
			dataStore,
		),
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *agentTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := getRoundTripToken(request, transport.tokenManager, transport.endpoint.ID)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentKubernetesSATokenHeader, token)

	if strings.HasPrefix(request.URL.Path, "/v2") {
		decorateAgentRequest(request, transport.dataStore)
	}

	signature, err := transport.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentPublicKeyHeader, transport.signatureService.EncodedPublicKey())
	request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)

	return transport.baseTransport.RoundTrip(request)
}
