package dockercompose

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type (
	// AgentTransport is an http.Transport wrapper that adds custom http headers to communicate to an Agent
	AgentTransport struct {
		httpTransport      *http.Transport
		signatureService   portainer.DigitalSignatureService
		endpointIdentifier portainer.EndpointID
	}
)

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewAgentTransport(signatureService portainer.DigitalSignatureService, httpTransport *http.Transport) *AgentTransport {
	transport := &AgentTransport{
		httpTransport:    httpTransport,
		signatureService: signatureService,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *AgentTransport) RoundTrip(request *http.Request) (*http.Response, error) {

	signature, err := transport.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentPublicKeyHeader, transport.signatureService.EncodedPublicKey())
	request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)

	return transport.httpTransport.RoundTrip(request)
}
