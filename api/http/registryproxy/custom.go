package registryproxy

import (
	"net/http"
	"net/url"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

type customTransport struct {
	config        *portainer.RegistryManagementConfiguration
	httpTransport *http.Transport
}

func newCustomRegistryProxy(uri string, config *portainer.RegistryManagementConfiguration) (http.Handler, error) {
	scheme := "http"
	if config.TLSConfig.TLS {
		scheme = "https"
	}

	url, err := url.Parse(scheme + "://" + uri)
	if err != nil {
		return nil, err
	}

	url.Scheme = scheme

	proxy := newSingleHostReverseProxyWithHostHeader(url)
	proxy.Transport = &customTransport{
		config:        config,
		httpTransport: &http.Transport{},
	}

	if config.TLSConfig.TLS {
		tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(config.TLSConfig.TLSCACertPath, config.TLSConfig.TLSCertPath, config.TLSConfig.TLSKeyPath, config.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}

		proxy.Transport.(*customTransport).httpTransport.TLSClientConfig = tlsConfig
	}

	return proxy, nil
}

// RoundTrip will first send the request to the custom registry with basic authentication.
// If the the response code is 401 (Unauthorized), it will send an authentication request
// based on the information retrieved in the Www-Authenticate response header
// (https://docs.docker.com/registry/spec/auth/scope/#resource-provider-use) and
// retrieve an authentication token. It will then resend the request
// decorated with a new Authorization header containing the authentication token.
func (transport *customTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	request.Header.Del("Authorization")

	clonedRequest, err := cloneRequest(request)
	if err != nil {
		return nil, err
	}

	if transport.config.Authentication {
		clonedRequest.SetBasicAuth(transport.config.Username, transport.config.Password)
	}

	response, err := transport.httpTransport.RoundTrip(clonedRequest)
	if err != nil {
		return response, err
	}

	if response.StatusCode == http.StatusUnauthorized {
		token, err := requestToken(response, transport.config)
		if err != nil {
			return response, err
		}

		request.Header.Set("Authorization", "Bearer "+*token)
		response, err := transport.httpTransport.RoundTrip(request)
		return response, err
	}

	return response, nil
}
