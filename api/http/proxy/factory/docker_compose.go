package factory

import (
	"net/http"
	"net/url"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/proxy/factory/dockercompose"
)

func (factory *ProxyFactory) NewDockerComposeAgentProxy(endpoint *portainer.Endpoint) (http.Handler, error) {

	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	endpointURL.Scheme = "http"
	httpTransport := &http.Transport{}

	if endpoint.TLSConfig.TLS || endpoint.TLSConfig.TLSSkipVerify {
		config, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}

		httpTransport.TLSClientConfig = config
		endpointURL.Scheme = "https"
	}

	proxy := newSingleHostReverseProxyWithHostHeader(endpointURL)

	proxy.Transport = dockercompose.NewAgentTransport(factory.signatureService, httpTransport)

	return proxy, nil
}

func (factory *ProxyFactory) GetReverseTunnel(endpoint *portainer.Endpoint) *portainer.TunnelDetails {
	return factory.reverseTunnelService.GetTunnelDetails(endpoint.ID)
}
