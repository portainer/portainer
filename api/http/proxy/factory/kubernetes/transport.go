package kubernetes

import (
	"crypto/tls"
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type agentTransport struct {
	httpTransport    *http.Transport
	signatureService portainer.DigitalSignatureService
}

type edgeTransport struct {
	httpTransport        *http.Transport
	reverseTunnelService portainer.ReverseTunnelService
	endpointIdentifier   portainer.EndpointID
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewAgentTransport(signatureService portainer.DigitalSignatureService, tlsConfig *tls.Config) *agentTransport {
	return &agentTransport{
		httpTransport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
		signatureService: signatureService,
	}
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (p *agentTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	signature, err := p.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentPublicKeyHeader, p.signatureService.EncodedPublicKey())
	request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)

	return p.httpTransport.RoundTrip(request)
}

func NewEdgeTransport(reverseTunnelService portainer.ReverseTunnelService, endpointIdentifier portainer.EndpointID) *edgeTransport {
	return &edgeTransport{
		httpTransport:        &http.Transport{},
		reverseTunnelService: reverseTunnelService,
		endpointIdentifier:   endpointIdentifier,
	}
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (p *edgeTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	response, err := p.httpTransport.RoundTrip(request)

	if err == nil {
		p.reverseTunnelService.SetTunnelStatusToActive(p.endpointIdentifier)
	} else {
		p.reverseTunnelService.SetTunnelStatusToIdle(p.endpointIdentifier)
	}

	return response, err
}
