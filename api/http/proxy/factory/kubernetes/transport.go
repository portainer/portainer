package kubernetes

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"

	"github.com/portainer/portainer/api/http/security"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

type (
	localTransport struct {
		httpTransport      *http.Transport
		tokenManager       *tokenManager
		endpointIdentifier portainer.EndpointID
	}

	agentTransport struct {
		httpTransport      *http.Transport
		tokenManager       *tokenManager
		signatureService   portainer.DigitalSignatureService
		endpointIdentifier portainer.EndpointID
	}

	edgeTransport struct {
		httpTransport        *http.Transport
		tokenManager         *tokenManager
		reverseTunnelService portainer.ReverseTunnelService
		endpointIdentifier   portainer.EndpointID
	}
)

// NewLocalTransport returns a new transport that can be used to send requests to the local Kubernetes API
func NewLocalTransport(tokenManager *tokenManager,
	endpointIdentifier portainer.EndpointID) (*localTransport, error) {
	config, err := crypto.CreateTLSConfigurationFromBytes(nil, nil, nil, true, true)
	if err != nil {
		return nil, err
	}

	transport := &localTransport{
		httpTransport: &http.Transport{
			TLSClientConfig: config,
		},
		tokenManager:       tokenManager,
		endpointIdentifier: endpointIdentifier,
	}

	return transport, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *localTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := getRoundTripToken(request, transport.tokenManager, transport.endpointIdentifier)
	if err != nil {
		return nil, err
	}

	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	return transport.httpTransport.RoundTrip(request)
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewAgentTransport(signatureService portainer.DigitalSignatureService, tlsConfig *tls.Config,
	tokenManager *tokenManager, endpointIdentifier portainer.EndpointID) *agentTransport {
	transport := &agentTransport{
		httpTransport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
		tokenManager:       tokenManager,
		signatureService:   signatureService,
		endpointIdentifier: endpointIdentifier,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *agentTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := getRoundTripToken(request, transport.tokenManager, transport.endpointIdentifier)
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

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer Edge agent
func NewEdgeTransport(reverseTunnelService portainer.ReverseTunnelService, endpointIdentifier portainer.EndpointID, tokenManager *tokenManager) *edgeTransport {
	transport := &edgeTransport{
		httpTransport:        &http.Transport{},
		tokenManager:         tokenManager,
		reverseTunnelService: reverseTunnelService,
		endpointIdentifier:   endpointIdentifier,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *edgeTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := getRoundTripToken(request, transport.tokenManager, transport.endpointIdentifier)
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

func getRoundTripToken(
	request *http.Request,
	tokenManager *tokenManager,
	endpointIdentifier portainer.EndpointID,
) (string, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return "", err
	}

	var token string
	if tokenData.Role == portainer.AdministratorRole {
		token = tokenManager.getAdminServiceAccountToken()
	} else {
		token, err = tokenManager.getUserServiceAccountToken(
			int(tokenData.ID), int(endpointIdentifier))
		if err != nil {
			log.Printf("Failed retrieving service account token: %v", err)
			return "", err
		}
	}

	return token, nil
}
