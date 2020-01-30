package kubernetes

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"sync"

	"github.com/orcaman/concurrent-map"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

type agentTransport struct {
	httpTransport    *http.Transport
	signatureService portainer.DigitalSignatureService
	tokenManager     *tokenManager
}

type edgeTransport struct {
	httpTransport        *http.Transport
	reverseTunnelService portainer.ReverseTunnelService
	endpointIdentifier   portainer.EndpointID
	tokenManager         *tokenManager
}

type localTransport struct {
	httpTransport *http.Transport
	tokenManager  *tokenManager
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewLocalTransport(kubecli portainer.KubeClient, teamMembershipService portainer.TeamMembershipService) (*localTransport, error) {
	config, err := crypto.CreateTLSConfigurationFromBytes(nil, nil, nil, true, true)
	if err != nil {
		return nil, err
	}

	httpTransport := &http.Transport{
		TLSClientConfig: config,
	}

	tokenManager, err := newTokenManager(kubecli, teamMembershipService, true)
	if err != nil {
		return nil, err
	}

	transport := &localTransport{
		httpTransport: httpTransport,
		tokenManager:  tokenManager,
	}

	return transport, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *localTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := transport.tokenManager.getTokenFromRequest(request, true)
	if err != nil {
		return nil, err
	}

	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	return transport.httpTransport.RoundTrip(request)
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewAgentTransport(signatureService portainer.DigitalSignatureService, tlsConfig *tls.Config, kubecli portainer.KubeClient) *agentTransport {
	tokenManager := &tokenManager{
		kubecli:    kubecli,
		mutex:      sync.Mutex{},
		userTokens: cmap.New(),
	}

	transport := &agentTransport{
		httpTransport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
		signatureService: signatureService,
		tokenManager:     tokenManager,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *agentTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := transport.tokenManager.getTokenFromRequest(request, false)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentKubernetesSATokenHeader, token)

	signature, err := transport.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentPublicKeyHeader, transport.signatureService.EncodedPublicKey())
	request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)

	return transport.httpTransport.RoundTrip(request)
}

func NewEdgeTransport(reverseTunnelService portainer.ReverseTunnelService, endpointIdentifier portainer.EndpointID, kubecli portainer.KubeClient) *edgeTransport {
	tokenManager := &tokenManager{
		kubecli:    kubecli,
		mutex:      sync.Mutex{},
		userTokens: cmap.New(),
	}

	transport := &edgeTransport{
		httpTransport:        &http.Transport{},
		reverseTunnelService: reverseTunnelService,
		endpointIdentifier:   endpointIdentifier,
		tokenManager:         tokenManager,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *edgeTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := transport.tokenManager.getTokenFromRequest(request, false)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentKubernetesSATokenHeader, token)

	response, err := transport.httpTransport.RoundTrip(request)

	if err == nil {
		transport.reverseTunnelService.SetTunnelStatusToActive(transport.endpointIdentifier)
	} else {
		transport.reverseTunnelService.SetTunnelStatusToIdle(transport.endpointIdentifier)
	}

	return response, err
}
