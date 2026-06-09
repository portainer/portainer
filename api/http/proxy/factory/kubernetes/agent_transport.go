package kubernetes

import (
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
)

type agentTransport struct {
	*baseTransport
	signatureService portainer.DigitalSignatureService
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewAgentTransport(signatureService portainer.DigitalSignatureService, tokenManager *tokenManager, endpoint *portainer.Endpoint, k8sClientFactory *cli.ClientFactory, dataStore dataservices.DataStore, jwtService portainer.JWTService) (*agentTransport, error) {
	tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig)
	if err != nil {
		return nil, err
	}

	transport := &agentTransport{
		baseTransport: newBaseTransport(
			ssrf.WrapTransport(&http.Transport{
				TLSClientConfig: tlsConfig,
			}),
			tokenManager,
			endpoint,
			k8sClientFactory,
			dataStore,
			jwtService,
		),
		signatureService: signatureService,
	}

	return transport, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *agentTransport) RoundTrip(request *http.Request) (*http.Response, error) {
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
	if err != nil {
		return response, err
	}
	response.Header.Set(portainer.PortainerCacheHeader, "true")

	return response, err
}
