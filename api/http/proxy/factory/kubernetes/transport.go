package kubernetes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"

	portainer "github.com/portainer/portainer/api"
)

type baseTransport struct {
	httpTransport    *http.Transport
	tokenManager     *tokenManager
	endpoint         *portainer.Endpoint
	k8sClientFactory *cli.ClientFactory
	dataStore        portainer.DataStore
}

func newBaseTransport(httpTransport *http.Transport, tokenManager *tokenManager, endpoint *portainer.Endpoint, k8sClientFactory *cli.ClientFactory, dataStore portainer.DataStore) *baseTransport {
	return &baseTransport{
		httpTransport:    httpTransport,
		tokenManager:     tokenManager,
		endpoint:         endpoint,
		k8sClientFactory: k8sClientFactory,
		dataStore:        dataStore,
	}
}

// #region KUBERNETES PROXY

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
	requestPath := strings.TrimPrefix(fullRequestPath, "/namespaces/")
	split := strings.SplitN(requestPath, "/", 2)
	namespace := split[0]

	requestPath = ""
	if len(split) > 1 {
		requestPath = split[1]
	}

	switch {
	case strings.HasPrefix(requestPath, "secrets"):
		return transport.proxySecretRequest(request, namespace, requestPath)
	case requestPath == "" && request.Method == "DELETE":
		return transport.proxyNamespaceDeleteOperation(request, namespace)
	default:
		return transport.executeKubernetesRequest(request, true)
	}
}

func (transport *baseTransport) executeKubernetesRequest(request *http.Request, shouldLog bool) (*http.Response, error) {

	resp, err := transport.httpTransport.RoundTrip(request)

	return resp, err
}

// #endregion

// #region ROUND TRIP

func (transport *baseTransport) prepareRoundTrip(request *http.Request) (string, error) {
	token, err := getRoundTripToken(request, transport.tokenManager)
	if err != nil {
		return "", err
	}

	request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	return token, nil
}

// RoundTrip is the implementation of the the http.RoundTripper interface
func (transport *baseTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return transport.proxyKubernetesRequest(request)
}

func getRoundTripToken(request *http.Request, tokenManager *tokenManager) (string, error) {
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

// #endregion

// #region DECORATE FUNCTIONS

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

// #endregion
