package kubernetes

import (
	"crypto/tls"
	"fmt"
	"io/ioutil"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/security"
)

const defaultServiceAccountTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type agentTransport struct {
	httpTransport    *http.Transport
	signatureService portainer.DigitalSignatureService
}

type edgeTransport struct {
	httpTransport        *http.Transport
	reverseTunnelService portainer.ReverseTunnelService
	endpointIdentifier   portainer.EndpointID
}

type localTransport struct {
	httpTransport *http.Transport
	bearerToken   string
	kubecli       portainer.KubeClient
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewLocalTransport(kubecli portainer.KubeClient) (*localTransport, error) {
	token, err := ioutil.ReadFile(defaultServiceAccountTokenFile)
	if err != nil {
		return nil, err
	}

	config, err := crypto.CreateTLSConfigurationFromBytes(nil, nil, nil, true, true)
	if err != nil {
		return nil, err
	}

	httpTransport := &http.Transport{
		TLSClientConfig: config,
	}

	transport := &localTransport{
		httpTransport: httpTransport,
		bearerToken:   string(token),
		kubecli:       kubecli,
	}

	return transport, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (p *localTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	if tokenData.Role != portainer.AdministratorRole {
		token, err := p.kubecli.GetServiceAccountBearerToken(int(tokenData.ID), tokenData.Username)
		if err != nil {
			return nil, err
		}

		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	} else {
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.bearerToken))

	}

	return p.httpTransport.RoundTrip(request)
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
