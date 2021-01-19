package dockercompose

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

type (
	LocalTransport struct {
		httpTransport      *http.Transport
		endpointIdentifier portainer.EndpointID
	}

	AgentTransport struct {
		httpTransport      *http.Transport
		signatureService   portainer.DigitalSignatureService
		endpointIdentifier portainer.EndpointID
	}

	EdgeTransport struct {
		httpTransport        *http.Transport
		reverseTunnelService portainer.ReverseTunnelService
		endpointIdentifier   portainer.EndpointID
	}
)

// NewLocalTransport returns a new transport that can be used to send requests to the local Kubernetes API
func NewLocalTransport() (*LocalTransport, error) {
	config, err := crypto.CreateTLSConfigurationFromBytes(nil, nil, nil, true, true)
	if err != nil {
		return nil, err
	}

	transport := &LocalTransport{
		httpTransport: &http.Transport{
			TLSClientConfig: config,
		},
	}

	return transport, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *LocalTransport) RoundTrip(request *http.Request) (*http.Response, error) {

	return transport.httpTransport.RoundTrip(request)
}

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

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer Edge agent
func NewEdgeTransport(reverseTunnelService portainer.ReverseTunnelService, endpointIdentifier portainer.EndpointID, httpTransport *http.Transport) *EdgeTransport {
	transport := &EdgeTransport{
		httpTransport:        httpTransport,
		reverseTunnelService: reverseTunnelService,
		endpointIdentifier:   endpointIdentifier,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *EdgeTransport) RoundTrip(request *http.Request) (*http.Response, error) {

	response, err := transport.httpTransport.RoundTrip(request)

	if err == nil {
		transport.reverseTunnelService.SetTunnelStatusToActive(transport.endpointIdentifier)
	} else {
		transport.reverseTunnelService.SetTunnelStatusToIdle(transport.endpointIdentifier)
	}

	return response, err
}
