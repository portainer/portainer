package registryproxy

import (
	"encoding/json"
	"net/http"
	"net/url"
	"regexp"
	"time"

	portainer "github.com/portainer/portainer/api"
)

type (
	tokenSecuredTransport struct {
		config *portainer.RegistryManagementConfiguration
		client *http.Client
	}

	genericAuthenticationResponse struct {
		AccessToken string `json:"token"`
	}

	azureAuthenticationResponse struct {
		AccessToken string `json:"access_token"`
	}
)

func newTokenSecuredRegistryProxy(uri string, config *portainer.RegistryManagementConfiguration) (http.Handler, error) {
	url, err := url.Parse("https://" + uri)
	if err != nil {
		return nil, err
	}

	proxy := newSingleHostReverseProxyWithHostHeader(url)
	proxy.Transport = &tokenSecuredTransport{
		config: config,
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

	response, err := http.DefaultTransport.RoundTrip(requestCopy)
	if err != nil {
		return response, err
	}

	if response.StatusCode == http.StatusUnauthorized {
		wwwAuthenticateHeader := response.Header.Get("Www-Authenticate")
		authenticationDetails := extractWWWAuthenticateValues(wwwAuthenticateHeader)

		authRequest, err := http.NewRequest(http.MethodGet, authenticationDetails["realm"], nil)
		if err != nil {
			return response, err
		}

		q := authRequest.URL.Query()
		if authenticationDetails["service"] != "" {
			q.Add("service", authenticationDetails["service"])
		}
		if authenticationDetails["scope"] != "" {
			q.Add("scope", authenticationDetails["scope"])
		}
		authRequest.URL.RawQuery = q.Encode()
		authRequest.SetBasicAuth(transport.config.Username, transport.config.Password)

		authResponse, err := transport.client.Do(authRequest)
		if err != nil {
			return authResponse, err
		}
		defer authResponse.Body.Close()

		token, err := retrieveToken(authResponse, transport.config.Type)
		if err != nil {
			return authResponse, err
		}

		request.Header.Set("Authorization", "Bearer "+token)
		return http.DefaultTransport.RoundTrip(request)
	}

	return response, nil
}

func retrieveToken(response *http.Response, registryType portainer.RegistryType) (string, error) {
	token := ""
	if registryType == portainer.AzureRegistry {
		var responseData azureAuthenticationResponse
		err := json.NewDecoder(response.Body).Decode(&responseData)
		if err != nil {
			return token, err
		}
		token = responseData.AccessToken
	} else {
		var responseData genericAuthenticationResponse
		err := json.NewDecoder(response.Body).Decode(&responseData)
		if err != nil {
			return token, err
		}
		token = responseData.AccessToken
	}
	return token, nil
}

var wwwAuthenticateHeaderRegexp = regexp.MustCompile(`(realm|service|scope)="(.*?)"`)

func extractWWWAuthenticateValues(s string) map[string]string {
	data := wwwAuthenticateHeaderRegexp.FindAllStringSubmatch(s, -1)

	result := make(map[string]string)
	for _, kv := range data {
		k := kv[1]
		v := kv[2]
		result[k] = v
	}

	return result
}
