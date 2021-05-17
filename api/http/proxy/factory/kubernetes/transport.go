package kubernetes

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

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
		dataStore          portainer.DataStore
		httpTransport      *http.Transport
		tokenManager       *tokenManager
		signatureService   portainer.DigitalSignatureService
		endpointIdentifier portainer.EndpointID
	}

	edgeTransport struct {
		dataStore            portainer.DataStore
		httpTransport        *http.Transport
		tokenManager         *tokenManager
		reverseTunnelService portainer.ReverseTunnelService
		endpointIdentifier   portainer.EndpointID
	}
)

// NewLocalTransport returns a new transport that can be used to send requests to the local Kubernetes API
func NewLocalTransport(tokenManager *tokenManager) (*localTransport, error) {
	config, err := crypto.CreateTLSConfigurationFromBytes(nil, nil, nil, true, true)
	if err != nil {
		return nil, err
	}

	transport := &localTransport{
		httpTransport: &http.Transport{
			TLSClientConfig: config,
		},
		tokenManager: tokenManager,
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
func NewAgentTransport(datastore portainer.DataStore, signatureService portainer.DigitalSignatureService, tlsConfig *tls.Config, tokenManager *tokenManager) *agentTransport {
	transport := &agentTransport{
		dataStore: datastore,
		httpTransport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
		tokenManager:     tokenManager,
		signatureService: signatureService,
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

	if strings.HasPrefix(request.URL.Path, "/v2") {
		decorateAgentRequest(request, transport.dataStore)
	}

	signature, err := transport.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentPublicKeyHeader, transport.signatureService.EncodedPublicKey())
	request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)

	return transport.httpTransport.RoundTrip(request)
}

// NewEdgeTransport returns a new transport that can be used to send signed requests to a Portainer Edge agent
func NewEdgeTransport(datastore portainer.DataStore, reverseTunnelService portainer.ReverseTunnelService, endpointIdentifier portainer.EndpointID, tokenManager *tokenManager) *edgeTransport {
	transport := &edgeTransport{
		dataStore:            datastore,
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

	if strings.HasPrefix(request.URL.Path, "/v2") {
		decorateAgentRequest(request, transport.dataStore)
	}

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
		token, err = tokenManager.getUserServiceAccountToken(int(tokenData.ID))
		if err != nil {
			log.Printf("Failed retrieving service account token: %v", err)
			return "", err
		}
	}

	return token, nil
}

func decorateAgentRequest(r *http.Request, dataStore portainer.DataStore) error {
	requestPath := strings.TrimPrefix(r.URL.Path, "/v2")

	switch {
	case strings.HasPrefix(requestPath, "/dockerhub"):
		decorateAgentDockerHubRequest(r, dataStore)
	}

	return nil
}

func decorateAgentDockerHubRequest(r *http.Request, dataStore portainer.DataStore) error {
	dockerhub, err := dataStore.DockerHub().DockerHub()
	if err != nil {
		return err
	}

	newBody, err := json.Marshal(dockerhub)
	if err != nil {
		return err
	}

	r.Method = http.MethodPost

	r.Body = ioutil.NopCloser(bytes.NewReader(newBody))
	r.ContentLength = int64(len(newBody))

	return nil
}
