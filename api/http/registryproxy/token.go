package registryproxy

import (
	"net/http"
	"net/url"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/useractivity"
	"github.com/portainer/portainer/api/http/utils"
)

type (
	tokenSecuredTransport struct {
		config            *portainer.RegistryManagementConfiguration
		client            *http.Client
		userActivityStore portainer.UserActivityStore
	}

	genericAuthenticationResponse struct {
		AccessToken string `json:"token"`
	}

	azureAuthenticationResponse struct {
		AccessToken string `json:"access_token"`
	}
)

func newTokenSecuredRegistryProxy(uri string, config *portainer.RegistryManagementConfiguration, userActivityStore portainer.UserActivityStore) (http.Handler, error) {
	url, err := url.Parse("https://" + uri)
	if err != nil {
		return nil, err
	}

	proxy := newSingleHostReverseProxyWithHostHeader(url)
	proxy.Transport = &tokenSecuredTransport{
		config:            config,
		userActivityStore: userActivityStore,
		client: &http.Client{
			Timeout: time.Second * 10,
		},
	}

	return proxy, nil
}

// RoundTrip will first send a lightweight copy of the original request (same URL and method) and
// will then inspect the response code of the response.
// If the response code is 401 (Unauthorized), it will send an authentication request
// based on the information retrieved in the Www-Authenticate response header
// (https://docs.docker.com/registry/spec/auth/scope/#resource-provider-use) and
// retrieve an authentication token. It will then retry the original request
// decorated with a new Authorization header containing the authentication token.
func (transport *tokenSecuredTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	requestCopy, err := http.NewRequest(request.Method, request.URL.String(), nil)
	if err != nil {
		return nil, err
	}

	body, err := utils.CopyBody(request)
	if err != nil {
		return nil, err
	}

	response, err := http.DefaultTransport.RoundTrip(requestCopy)
	if err != nil {
		return response, err
	}

	if response.StatusCode == http.StatusUnauthorized {
		token, err := requestToken(response, transport.config)
		if err != nil {
			return response, err
		}

		request.Header.Set("Authorization", "Bearer "+*token)
		response, err = http.DefaultTransport.RoundTrip(request)
		if err != nil {
			return nil, err
		}

	}

	// log if request is success
	if 200 <= response.StatusCode && response.StatusCode < 300 {
		useractivity.LogProxyActivity(transport.userActivityStore, "Portainer", request, body)
	}

	return response, nil
}
