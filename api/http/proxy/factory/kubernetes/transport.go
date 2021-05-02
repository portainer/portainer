package kubernetes

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/http/useractivity"
	"github.com/portainer/portainer/api/http/utils"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

type (
	baseTransport struct {
		httpTransport     *http.Transport
		tokenManager      *tokenManager
		endpoint          *portainer.Endpoint
		userActivityStore portainer.UserActivityStore
	}

	localTransport struct {
		*baseTransport
	}

	agentTransport struct {
		*baseTransport
		signatureService portainer.DigitalSignatureService
	}

	edgeTransport struct {
		*baseTransport
		reverseTunnelService portainer.ReverseTunnelService
	}
)

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *baseTransport) prepareRoundTrip(request *http.Request) error {
	token, err := getRoundTripToken(request, transport.tokenManager, transport.endpoint.ID)
	if err != nil {
		return err
	}

	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	return nil
}

// proxyKubernetesRequest intercepts a Kubernetes API request and apply logic based
// on the requested operation.
func (transport *baseTransport) proxyKubernetesRequest(request *http.Request) (*http.Response, error) {
	apiVersionRe := regexp.MustCompile(`^(/kubernetes)?/api/v[0-9](\.[0-9])?`)
	requestPath := apiVersionRe.ReplaceAllString(request.URL.Path, "")

	switch {
	case strings.EqualFold(requestPath, "/namespaces"):
		return transport.executeKubernetesRequest(request, true)
	case strings.HasPrefix(requestPath, "/namespaces"):
		return transport.proxyNamespacedRequest(request, requestPath)
	default:
		return transport.executeKubernetesRequest(request, true)
	}
}

func (transport *baseTransport) proxyNamespacedRequest(request *http.Request, fullRequestPath string) (*http.Response, error) {
	re := regexp.MustCompile(`/namespaces/([^/]*)/`)
	requestPath := re.ReplaceAllString(fullRequestPath, "")

	switch {
	case strings.HasPrefix(requestPath, "configmaps"):
		return transport.proxyConfigMapsRequest(request, requestPath)
	case strings.HasPrefix(requestPath, "secrets"):
		return transport.proxySecretsRequest(request, requestPath)
	default:
		return transport.executeKubernetesRequest(request, true)
	}
}

func (transport *baseTransport) executeKubernetesRequest(request *http.Request, shouldLog bool) (*http.Response, error) {
	var body []byte

	if shouldLog {
		bodyBytes, err := utils.CopyBody(request)
		if err != nil {
			return nil, err
		}

		body = bodyBytes
	}

	resp, err := transport.httpTransport.RoundTrip(request)

	// log if request is success
	if shouldLog && err == nil && (200 <= resp.StatusCode && resp.StatusCode < 300) {
		useractivity.LogProxyActivity(transport.userActivityStore, transport.endpoint.Name, request, body)
	}

	return resp, err
}

func (transport *baseTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return transport.proxyKubernetesRequest(request)
}

// NewLocalTransport returns a new transport that can be used to send requests to the local Kubernetes API
func NewLocalTransport(tokenManager *tokenManager, endpoint *portainer.Endpoint, userActivityStore portainer.UserActivityStore) (*localTransport, error) {
	config, err := crypto.CreateTLSConfigurationFromBytes(nil, nil, nil, true, true)
	if err != nil {
		return nil, err
	}

	transport := &localTransport{
		baseTransport: &baseTransport{
			httpTransport: &http.Transport{
				TLSClientConfig: config,
			},
			tokenManager:      tokenManager,
			endpoint:          endpoint,
			userActivityStore: userActivityStore,
		},
	}

	return transport, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *localTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	err := transport.prepareRoundTrip(request)
	if err != nil {
		return nil, err
	}

	return transport.baseTransport.RoundTrip(request)
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer agent
func NewAgentTransport(signatureService portainer.DigitalSignatureService, tlsConfig *tls.Config, tokenManager *tokenManager, endpoint *portainer.Endpoint, userActivityStore portainer.UserActivityStore) *agentTransport {
	transport := &agentTransport{
		baseTransport: &baseTransport{
			httpTransport: &http.Transport{
				TLSClientConfig: tlsConfig,
			},
			tokenManager:      tokenManager,
			endpoint:          endpoint,
			userActivityStore: userActivityStore,
		},
		signatureService: signatureService,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *agentTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := getRoundTripToken(request, transport.tokenManager, transport.endpoint.ID)
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

	return transport.baseTransport.RoundTrip(request)
}

// NewAgentTransport returns a new transport that can be used to send signed requests to a Portainer Edge agent
func NewEdgeTransport(reverseTunnelService portainer.ReverseTunnelService, endpoint *portainer.Endpoint, tokenManager *tokenManager, userActivityStore portainer.UserActivityStore) *edgeTransport {
	transport := &edgeTransport{
		baseTransport: &baseTransport{
			httpTransport:     &http.Transport{},
			tokenManager:      tokenManager,
			endpoint:          endpoint,
			userActivityStore: userActivityStore,
		},
		reverseTunnelService: reverseTunnelService,
	}

	return transport
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *edgeTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	token, err := getRoundTripToken(request, transport.tokenManager, transport.endpoint.ID)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentKubernetesSATokenHeader, token)

	response, err := transport.baseTransport.RoundTrip(request)

	if err == nil {
		transport.reverseTunnelService.SetTunnelStatusToActive(transport.endpoint.ID)
	} else {
		transport.reverseTunnelService.SetTunnelStatusToIdle(transport.endpoint.ID)
	}

	return response, err
}

func getRoundTripToken(request *http.Request, tokenManager *tokenManager, endpointIdentifier portainer.EndpointID) (string, error) {
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
