package proxy

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type edgeTransport struct {
	httpTransport        *http.Transport
	reverseTunnelService portainer.ReverseTunnelService
	endpointIdentifier   portainer.EndpointID
}

func NewEdgeTransport(reverseTunnelService portainer.ReverseTunnelService, endpointIdentifier portainer.EndpointID) *edgeTransport {
	return &edgeTransport{
		httpTransport:        &http.Transport{},
		reverseTunnelService: reverseTunnelService,
		endpointIdentifier:   endpointIdentifier,
	}
}

func (p *edgeTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	response, err := p.httpTransport.RoundTrip(request)

	if err == nil {
		p.reverseTunnelService.SetTunnelStatusToActive(p.endpointIdentifier)
	} else {
		p.reverseTunnelService.SetTunnelStatusToIdle(p.endpointIdentifier)
	}

	return response, err
}
