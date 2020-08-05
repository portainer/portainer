package factory

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"

	"github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/portainer/portainer/api/docker"
)

const azureAPIBaseURL = "https://management.azure.com"

var extensionPorts = map[portainer.ExtensionID]string{}

type (
	// ProxyFactory is a factory to create reverse proxies to Docker endpoints and extensions
	ProxyFactory struct {
		dataStore                   portainer.DataStore
		signatureService            portainer.DigitalSignatureService
		reverseTunnelService        portainer.ReverseTunnelService
		dockerClientFactory         *docker.ClientFactory
		kubernetesClientFactory     *cli.ClientFactory
		kubernetesTokenCacheManager *kubernetes.TokenCacheManager
	}
)

// NewProxyFactory returns a pointer to a new instance of a ProxyFactory
func NewProxyFactory(dataStore portainer.DataStore, signatureService portainer.DigitalSignatureService, tunnelService portainer.ReverseTunnelService, clientFactory *docker.ClientFactory, kubernetesClientFactory *cli.ClientFactory, kubernetesTokenCacheManager *kubernetes.TokenCacheManager) *ProxyFactory {
	return &ProxyFactory{
		dataStore:                   dataStore,
		signatureService:            signatureService,
		reverseTunnelService:        tunnelService,
		dockerClientFactory:         clientFactory,
		kubernetesClientFactory:     kubernetesClientFactory,
		kubernetesTokenCacheManager: kubernetesTokenCacheManager,
	}
}

// BuildExtensionURL returns the URL to an extension server
func BuildExtensionURL(extensionID portainer.ExtensionID) string {
	return fmt.Sprintf("http://%s:%s", portainer.ExtensionServer, extensionPorts[extensionID])
}

// NewExtensionProxy returns a new HTTP proxy to an extension server
func (factory *ProxyFactory) NewExtensionProxy(extensionID portainer.ExtensionID) (http.Handler, error) {
	address := "http://" + portainer.ExtensionServer + ":" + extensionPorts[extensionID]

	extensionURL, err := url.Parse(address)
	if err != nil {
		return nil, err
	}

	extensionURL.Scheme = "http"
	proxy := httputil.NewSingleHostReverseProxy(extensionURL)
	return proxy, nil
}

// NewLegacyExtensionProxy returns a new HTTP proxy to a legacy extension server (Storidge)
func (factory *ProxyFactory) NewLegacyExtensionProxy(extensionAPIURL string) (http.Handler, error) {
	extensionURL, err := url.Parse(extensionAPIURL)
	if err != nil {
		return nil, err
	}

	extensionURL.Scheme = "http"
	proxy := httputil.NewSingleHostReverseProxy(extensionURL)
	return proxy, nil
}

// NewEndpointProxy returns a new reverse proxy (filesystem based or HTTP) to an endpoint API server
func (factory *ProxyFactory) NewEndpointProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	switch endpoint.Type {
	case portainer.AzureEnvironment:
		return newAzureProxy(endpoint)
	case portainer.EdgeAgentOnKubernetesEnvironment, portainer.AgentOnKubernetesEnvironment, portainer.KubernetesLocalEnvironment:
		return factory.newKubernetesProxy(endpoint)
	}

	return factory.newDockerProxy(endpoint)
}

// NewGitlabProxy returns a new HTTP proxy to a Gitlab API server
func (factory *ProxyFactory) NewGitlabProxy(gitlabAPIUri string) (http.Handler, error) {
	return newGitlabProxy(gitlabAPIUri)
}
