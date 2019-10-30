package proxy

import (
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/proxy/provider/azure"
	dockerprovider "github.com/portainer/portainer/api/http/proxy/provider/docker"
)

const azureAPIBaseURL = "https://management.azure.com"

// proxyFactory is a factory to create reverse proxies to Docker endpoints
type proxyFactory struct {
	ResourceControlService portainer.ResourceControlService
	UserService            portainer.UserService
	TeamMembershipService  portainer.TeamMembershipService
	SettingsService        portainer.SettingsService
	RegistryService        portainer.RegistryService
	DockerHubService       portainer.DockerHubService
	SignatureService       portainer.DigitalSignatureService
	ReverseTunnelService   portainer.ReverseTunnelService
	ExtensionService       portainer.ExtensionService
	DockerClientFactory    *docker.ClientFactory
}

func (factory *proxyFactory) newHTTPProxy(u *url.URL) http.Handler {
	u.Scheme = "http"
	return httputil.NewSingleHostReverseProxy(u)
}

func newAzureProxy(credentials *portainer.AzureCredentials) (http.Handler, error) {
	remoteURL, err := url.Parse(azureAPIBaseURL)
	if err != nil {
		return nil, err
	}

	proxy := newSingleHostReverseProxyWithHostHeader(remoteURL)
	proxy.Transport = azure.NewTransport(credentials)

	return proxy, nil
}

func (factory *proxyFactory) newDockerHTTPSProxy(u *url.URL, tlsConfig *portainer.TLSConfiguration, endpoint *portainer.Endpoint) (http.Handler, error) {
	u.Scheme = "https"

	proxy, err := factory.createDockerReverseProxy(u, endpoint)
	if err != nil {
		return nil, err
	}

	config, err := crypto.CreateTLSConfigurationFromDisk(tlsConfig.TLSCACertPath, tlsConfig.TLSCertPath, tlsConfig.TLSKeyPath, tlsConfig.TLSSkipVerify)
	if err != nil {
		return nil, err
	}

	proxy.Transport.(*dockerprovider.Transport).HTTPTransport.TLSClientConfig = config
	return proxy, nil
}

func (factory *proxyFactory) newDockerHTTPProxy(u *url.URL, endpoint *portainer.Endpoint) (http.Handler, error) {
	u.Scheme = "http"
	return factory.createDockerReverseProxy(u, endpoint)
}

func (factory *proxyFactory) createDockerReverseProxy(u *url.URL, endpoint *portainer.Endpoint) (*httputil.ReverseProxy, error) {
	transportParameters := &dockerprovider.TransportParameters{
		Endpoint:               endpoint,
		ResourceControlService: factory.ResourceControlService,
		UserService:            factory.UserService,
		TeamMembershipService:  factory.TeamMembershipService,
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
		SettingsService:        factory.SettingsService,
		ReverseTunnelService:   factory.ReverseTunnelService,
		ExtensionService:       factory.ExtensionService,
		SignatureService:       factory.SignatureService,
	}

	dockerClient, err := factory.DockerClientFactory.CreateClient(endpoint, "")
	if err != nil {
		return nil, err
	}

	proxy := newSingleHostReverseProxyWithHostHeader(u)
	proxy.Transport = dockerprovider.NewTransport(transportParameters, &http.Transport{}, dockerClient)
	return proxy, nil
}

func newSocketTransport(socketPath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			return net.Dial("unix", socketPath)
		},
	}
}
