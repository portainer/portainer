package proxy

import (
	"net/http"
	"net/url"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer"
)

// OrcaManager represents a service used to manage Docker proxies.
type OrcaManager struct {
	proxyFactory *proxyFactory
	proxies      cmap.ConcurrentMap
}

// NewOrcaManager initializes a new proxy Service
func NewOrcaManager(resourceControlService portainer.ResourceControlService, teamMembershipService portainer.TeamMembershipService, settingsService portainer.SettingsService) *OrcaManager {
	return &OrcaManager{
		proxies: cmap.New(),
		proxyFactory: &proxyFactory{
			ResourceControlService: resourceControlService,
			TeamMembershipService:  teamMembershipService,
			SettingsService:        settingsService,
		},
	}
}

// CreateAndRegisterOrcaProxy creates a new HTTP reverse proxy and adds it to the registered proxies.
// It can also be used to create a new HTTP reverse proxy and replace an already registered proxy.
func (manager *OrcaManager) CreateAndRegisterOrcaProxy(id string, urlStr string, useTls bool) (http.Handler, error) {
	var proxy http.Handler

	endpointURL, err := url.Parse(urlStr)
	if err != nil {
		return nil, err
	}

	//if endpointURL.Scheme == "tcp" {
		//if useTls {
		//	proxy, err = manager.proxyFactory.newHTTPSProxy(endpointURL, endpoint)
		//	if err != nil {
		//		return nil, err
		//	}
		//} else {
	proxy = manager.proxyFactory.newHTTPProxy(endpointURL)
		//}
	//} else {
		// Assume unix:// scheme
	//	proxy = manager.proxyFactory.newSocketProxy(endpointURL.Path)
	//}

	manager.proxies.Set(id, proxy)
	return proxy, nil
}

// GetOrcaProxy returns the proxy associated to a key
func (manager *OrcaManager) GetOrcaProxy(key string) http.Handler {
	proxy, ok := manager.proxies.Get(key)
	if !ok {
		return nil
	}
	return proxy.(http.Handler)
}

// DeleteOrcaProxy deletes the proxy associated to a key
func (manager *OrcaManager) DeleteOrcaProxy(key string) {
	manager.proxies.Remove(key)
}
