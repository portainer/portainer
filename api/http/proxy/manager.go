package proxy

import (
	"net/http"
	"net/url"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer"
)

// Manager represents a service used to manage Docker proxies.
type Manager struct {
	proxyFactory *proxyFactory
	proxies      cmap.ConcurrentMap
}

// NewManager initializes a new proxy Service
func NewManager(resourceControlService portainer.ResourceControlService, teamMembershipService portainer.TeamMembershipService, settingsService portainer.SettingsService) *Manager {
	return &Manager{
		proxies: cmap.New(),
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
	switch endpointURL.Scheme {
	case "tcp": {
		if endpoint.TLS {
			proxy, err = manager.proxyFactory.newHTTPSProxy(endpointURL, endpoint)
			if err != nil {
				return nil, err
			}
		} else {
			proxy = manager.proxyFactory.newHTTPProxy(endpointURL)
		}
	}
	case "npipe":
		proxy = manager.proxyFactory.newNamedPipeProxy(endpointURL.Path)
	default:
		// Assume unix:// scheme
		proxy = manager.proxyFactory.newSocketProxy(endpointURL.Path)
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
