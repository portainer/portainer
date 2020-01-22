package kubernetes

import (
	"crypto/tls"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"sync"

	"github.com/orcaman/concurrent-map"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/security"
)

const defaultServiceAccountTokenFile = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type agentTransport struct {
	httpTransport    *http.Transport
	signatureService portainer.DigitalSignatureService
	kubecli          portainer.KubeClient
	mutex            sync.Mutex
	userTokens       cmap.ConcurrentMap
}

type edgeTransport struct {
	httpTransport        *http.Transport
	reverseTunnelService portainer.ReverseTunnelService
	endpointIdentifier   portainer.EndpointID
}

type localTransport struct {
	httpTransport *http.Transport
	kubecli       portainer.KubeClient
	mutex         sync.Mutex
	adminToken    string
	userTokens    cmap.ConcurrentMap
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
		kubecli:       kubecli,
		adminToken:    string(token),
		userTokens:    cmap.New(),
	}

	return transport, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *localTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	if tokenData.Role != portainer.AdministratorRole {
		key := strconv.Itoa(int(tokenData.ID))
		token, ok := transport.userTokens.Get(key)
		if !ok {
			transport.mutex.Lock()
			defer transport.mutex.Unlock()

			err := transport.kubecli.SetupUserServiceAccount(int(tokenData.ID), tokenData.Username)
			if err != nil {
				return nil, err
			}

			serviceAccountToken, err := transport.kubecli.GetServiceAccountBearerToken(int(tokenData.ID), tokenData.Username)
			if err != nil {
				return nil, err
			}

			transport.userTokens.Set(key, serviceAccountToken)
			token = serviceAccountToken
		}

		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.(string)))
	} else {
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", transport.adminToken))
	}

	return transport.httpTransport.RoundTrip(request)
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewAgentTransport(signatureService portainer.DigitalSignatureService, tlsConfig *tls.Config, kubecli portainer.KubeClient) (*agentTransport, error) {
	transport := &agentTransport{
		httpTransport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
		signatureService: signatureService,
		kubecli:          kubecli,
		userTokens:       cmap.New(),
	}

	return transport, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *agentTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	tokenData, err := security.RetrieveTokenData(request)
	if err != nil {
		return nil, err
	}

	if tokenData.Role != portainer.AdministratorRole {
		key := strconv.Itoa(int(tokenData.ID))
		token, ok := transport.userTokens.Get(key)
		if !ok {
			transport.mutex.Lock()
			defer transport.mutex.Unlock()

			err := transport.kubecli.SetupUserServiceAccount(int(tokenData.ID), tokenData.Username)
			if err != nil {
				return nil, err
			}

			serviceAccountToken, err := transport.kubecli.GetServiceAccountBearerToken(int(tokenData.ID), tokenData.Username)
			if err != nil {
				return nil, err
			}

			transport.userTokens.Set(key, serviceAccountToken)
			token = serviceAccountToken
		}

		request.Header.Set(portainer.PortainerAgentKubernetesSATokenHeader, token.(string))
	}

	signature, err := transport.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentPublicKeyHeader, transport.signatureService.EncodedPublicKey())
	request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)

	return transport.httpTransport.RoundTrip(request)
}

func NewEdgeTransport(reverseTunnelService portainer.ReverseTunnelService, endpointIdentifier portainer.EndpointID) *edgeTransport {
	return &edgeTransport{
		httpTransport:        &http.Transport{},
		reverseTunnelService: reverseTunnelService,
		endpointIdentifier:   endpointIdentifier,
	}
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *edgeTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	response, err := transport.httpTransport.RoundTrip(request)

	if err == nil {
		transport.reverseTunnelService.SetTunnelStatusToActive(transport.endpointIdentifier)
	} else {
		transport.reverseTunnelService.SetTunnelStatusToIdle(transport.endpointIdentifier)
	}

	return response, err
}
