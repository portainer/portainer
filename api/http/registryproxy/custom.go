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

// RoundTrip will simply check if the configuration associated to the
// custom registry requires authentication and add the specified credentials
// via basic auth if needed.
func (transport *customTransport) RoundTrip(request *http.Request) (*http.Response, error) {

	if transport.config.Authentication {
		request.SetBasicAuth(transport.config.Username, transport.config.Password)
	}

	return transport.httpTransport.RoundTrip(request)
}
