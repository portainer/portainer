package proxy

import (
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

// AzureAPIBaseURL is the URL where Azure API requests will be proxied.
const AzureAPIBaseURL = "https://management.azure.com"

// proxyFactory is a factory to create reverse proxies to Docker endpoints
type proxyFactory struct {
	ResourceControlService portainer.ResourceControlService
	TeamMembershipService  portainer.TeamMembershipService
	SettingsService        portainer.SettingsService
	RegistryService        portainer.RegistryService
	DockerHubService       portainer.DockerHubService
	SignatureService       portainer.DigitalSignatureService
	ReverseTunnelService   portainer.ReverseTunnelService
}

func (factory *proxyFactory) newHTTPProxy(u *url.URL) http.Handler {
	u.Scheme = "http"
	return httputil.NewSingleHostReverseProxy(u)
}

func newAzureProxy(credentials *portainer.AzureCredentials) (http.Handler, error) {
	url, err := url.Parse(AzureAPIBaseURL)
	if err != nil {
		return nil, err
	}

	proxy := newSingleHostReverseProxyWithHostHeader(url)
	proxy.Transport = NewAzureTransport(credentials)

	return proxy, nil
}

func (factory *proxyFactory) newDockerHTTPSProxy(u *url.URL, tlsConfig *portainer.TLSConfiguration, enableSignature bool, endpointID portainer.EndpointID) (http.Handler, error) {
	u.Scheme = "https"

	proxy := factory.createDockerReverseProxy(u, enableSignature, endpointID)
	config, err := crypto.CreateTLSConfigurationFromDisk(tlsConfig.TLSCACertPath, tlsConfig.TLSCertPath, tlsConfig.TLSKeyPath, tlsConfig.TLSSkipVerify)
	if err != nil {
		return nil, err
	}

	proxy.Transport.(*proxyTransport).dockerTransport.TLSClientConfig = config
	return proxy, nil
}

func (factory *proxyFactory) newDockerHTTPProxy(u *url.URL, enableSignature bool, endpointID portainer.EndpointID) http.Handler {
	u.Scheme = "http"
	return factory.createDockerReverseProxy(u, enableSignature, endpointID)
}

func (factory *proxyFactory) createDockerReverseProxy(u *url.URL, enableSignature bool, endpointID portainer.EndpointID) *httputil.ReverseProxy {
	proxy := newSingleHostReverseProxyWithHostHeader(u)
	transport := &proxyTransport{
		enableSignature:        enableSignature,
		ResourceControlService: factory.ResourceControlService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
		ReverseTunnelService:   factory.ReverseTunnelService,
		dockerTransport:        &http.Transport{},
		endpointIdentifier:     endpointID,
	}

	if enableSignature {
		transport.SignatureService = factory.SignatureService
	}

	proxy.Transport = transport
	return proxy
}

func newSocketTransport(socketPath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			return net.Dial("unix", socketPath)
		},
	}
}
