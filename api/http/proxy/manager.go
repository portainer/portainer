package proxy

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer"
)

// Manager represents a service used to manage Docker proxies.
type Manager struct {
	proxyFactory     *proxyFactory
	proxies          cmap.ConcurrentMap
	extensionProxies cmap.ConcurrentMap
}

// NewManager initializes a new proxy Service
func NewManager(resourceControlService portainer.ResourceControlService, teamMembershipService portainer.TeamMembershipService, settingsService portainer.SettingsService) *Manager {
	return &Manager{
		proxies:          cmap.New(),
		extensionProxies: cmap.New(),
		proxyFactory: &proxyFactory{
			ResourceControlService: resourceControlService,
			TeamMembershipService:  teamMembershipService,
			SettingsService:        settingsService,
		},
	}
}

// CreateAndRegisterProxy creates a new HTTP reverse proxy and adds it to the registered proxies.
// It can also be used to create a new HTTP reverse proxy and replace an already registered proxy.
func (manager *Manager) CreateAndRegisterProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	var proxy http.Handler

	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	if endpointURL.Scheme == "tcp" {
		if endpoint.TLSConfig.TLS {
			proxy, err = manager.proxyFactory.newDockerHTTPSProxy(endpointURL, endpoint)
			if err != nil {
				return nil, err
			}
		} else {
			proxy = manager.proxyFactory.newDockerHTTPProxy(endpointURL)
		}
	} else {
		// Assume unix:// scheme
		proxy = manager.proxyFactory.newDockerSocketProxy(endpointURL.Path)
	}

	manager.proxies.Set(string(endpoint.ID), proxy)
	return proxy, nil
}

// GetProxy returns the proxy associated to a key
func (manager *Manager) GetProxy(key string) http.Handler {
	proxy, ok := manager.proxies.Get(key)
	if !ok {
		return nil
	}
	return proxy.(http.Handler)
}

// DeleteProxy deletes the proxy associated to a key
func (manager *Manager) DeleteProxy(key string) {
	manager.proxies.Remove(key)
}

// CreateAndRegisterExtensionProxy creates a new HTTP reverse proxy for an extension and adds it to the registered proxies.
func (manager *Manager) CreateAndRegisterExtensionProxy(key, extensionAPIURL string) (http.Handler, error) {

	extensionURL, err := url.Parse(extensionAPIURL)
	if err != nil {
		return nil, err
	}

	proxy := manager.proxyFactory.newExtensionHTTPPRoxy(extensionURL)
	manager.extensionProxies.Set(key, proxy)
	return proxy, nil
}

// GetExtensionProxy returns the extension proxy associated to a key
func (manager *Manager) GetExtensionProxy(key string) http.Handler {
	proxy, ok := manager.extensionProxies.Get(key)
	if !ok {
		return nil
	}
	return proxy.(http.Handler)
}

// DeleteExtensionProxies deletes all the extension proxies associated to a key
func (manager *Manager) DeleteExtensionProxies(key string) {
	for _, k := range manager.extensionProxies.Keys() {
		if strings.Contains(k, key+"_") {
			manager.extensionProxies.Remove(k)
		}
	}
}
