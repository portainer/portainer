package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"

	cmap "github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer/api/kubernetes/cli"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/proxy/factory"
)

// TODO: contain code related to legacy extension management

type (
	// Manager represents a service used to manage proxies to endpoints and extensions.
	Manager struct {
		proxyFactory           *factory.ProxyFactory
		endpointProxies        cmap.ConcurrentMap
		legacyExtensionProxies cmap.ConcurrentMap
	}
)

// NewManager initializes a new proxy Service
func NewManager(dataStore portainer.DataStore, signatureService portainer.DigitalSignatureService, tunnelService portainer.ReverseTunnelService, clientFactory *docker.ClientFactory, kubernetesClientFactory *cli.ClientFactory, kubernetesTokenCacheManager *kubernetes.TokenCacheManager) *Manager {
	return &Manager{
		endpointProxies:        cmap.New(),
		legacyExtensionProxies: cmap.New(),
		proxyFactory:           factory.NewProxyFactory(dataStore, signatureService, tunnelService, clientFactory, kubernetesClientFactory, kubernetesTokenCacheManager),
	}
}

// CreateAndRegisterEndpointProxy creates a new HTTP reverse proxy based on endpoint properties and and adds it to the registered proxies.
// It can also be used to create a new HTTP reverse proxy and replace an already registered proxy.
func (manager *Manager) CreateAndRegisterEndpointProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	proxy, err := manager.proxyFactory.NewEndpointProxy(endpoint)
	if err != nil {
		return nil, err
	}

	manager.endpointProxies.Set(string(endpoint.ID), proxy)
	return proxy, nil
}

// GetEndpointProxy returns the proxy associated to a key
func (manager *Manager) GetEndpointProxy(endpoint *portainer.Endpoint) http.Handler {
	proxy, ok := manager.endpointProxies.Get(string(endpoint.ID))
	if !ok {
		return nil
	}

	return proxy.(http.Handler)
}

// DeleteEndpointProxy deletes the proxy associated to a key
func (manager *Manager) DeleteEndpointProxy(endpoint *portainer.Endpoint) {
	manager.endpointProxies.Remove(string(endpoint.ID))
}

// CreateLegacyExtensionProxy creates a new HTTP reverse proxy for a legacy extension and adds it to the registered proxies
func (manager *Manager) CreateLegacyExtensionProxy(key, extensionAPIURL string) (http.Handler, error) {
	proxy, err := manager.proxyFactory.NewLegacyExtensionProxy(extensionAPIURL)
	if err != nil {
		return nil, err
	}

	manager.legacyExtensionProxies.Set(key, proxy)
	return proxy, nil
}

// GetLegacyExtensionProxy returns a legacy extension proxy associated to a key
func (manager *Manager) GetLegacyExtensionProxy(key string) http.Handler {
	proxy, ok := manager.legacyExtensionProxies.Get(key)
	if !ok {
		return nil
	}
	return proxy.(http.Handler)
}

// CreateGitlabProxy creates a new HTTP reverse proxy that can be used to send requests to the Gitlab API
func (manager *Manager) CreateGitlabProxy(url string) (http.Handler, error) {
	return manager.proxyFactory.NewGitlabProxy(url)
}
