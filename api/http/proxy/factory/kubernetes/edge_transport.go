package kubernetes

import (
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
)

type edgeTransport struct {
	*baseTransport
	signatureService     portainer.DigitalSignatureService
	reverseTunnelService portainer.ReverseTunnelService
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer Edge agent
func NewEdgeTransport(dataStore dataservices.DataStore, signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService, endpoint *portainer.Endpoint, tokenManager *tokenManager, k8sClientFactory *cli.ClientFactory) *edgeTransport {
	transport := &edgeTransport{
		baseTransport: newBaseTransport(
			&http.Transport{},
			tokenManager,
			endpoint,
			k8sClientFactory,
			dataStore,
		),
		reverseTunnelService: reverseTunnelService,
		signatureService:     signatureService,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *edgeTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := transport.getRoundTripToken(request, transport.tokenManager)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentKubernetesSATokenHeader, token)

	if strings.HasPrefix(request.URL.Path, "/v2") {
		err := decorateAgentRequest(request, transport.dataStore)
		if err != nil {
			return nil, err
		}
	}

	signature, err := transport.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentPublicKeyHeader, transport.signatureService.EncodedPublicKey())
	request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)

	response, err := transport.baseTransport.RoundTrip(request)

	if err == nil {
		transport.reverseTunnelService.SetTunnelStatusToActive(transport.endpoint.ID)
	} else {
		transport.reverseTunnelService.SetTunnelStatusToIdle(transport.endpoint.ID)
	}

	return response, err
}
