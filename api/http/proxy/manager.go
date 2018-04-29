package proxy

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer"
)

type (
	// Manager represents a service used to manage Docker proxies.
	Manager struct {
		proxyFactory     *proxyFactory
		proxies          cmap.ConcurrentMap
		extensionProxies cmap.ConcurrentMap
	}

	// ManagerParams represents the required parameters to create a new Manager instance.
	ManagerParams struct {
		ResourceControlService portainer.ResourceControlService
		TeamMembershipService  portainer.TeamMembershipService
		SettingsService        portainer.SettingsService
		RegistryService        portainer.RegistryService
		DockerHubService       portainer.DockerHubService
		SignatureService       portainer.DigitalSignatureService
	}
)

// NewManager initializes a new proxy Service
func NewManager(parameters *ManagerParams) *Manager {
	return &Manager{
		proxies:          cmap.New(),
		extensionProxies: cmap.New(),
		proxyFactory: &proxyFactory{
			ResourceControlService: parameters.ResourceControlService,
			TeamMembershipService:  parameters.TeamMembershipService,
			SettingsService:        parameters.SettingsService,
			RegistryService:        parameters.RegistryService,
			DockerHubService:       parameters.DockerHubService,
			SignatureService:       parameters.SignatureService,
		},
	}
}

func (manager *Manager) createDockerProxy(endpointURL *url.URL, tlsConfig *portainer.TLSConfiguration) (http.Handler, error) {
	if endpointURL.Scheme == "tcp" {
		if tlsConfig.TLS || tlsConfig.TLSSkipVerify {
			return manager.proxyFactory.newDockerHTTPSProxy(endpointURL, tlsConfig, false)
		}
		return manager.proxyFactory.newDockerHTTPProxy(endpointURL, false), nil
	}
	// Assume unix:// scheme
	return manager.proxyFactory.newDockerSocketProxy(endpointURL.Path), nil
}

func (manager *Manager) createProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	switch endpoint.Type {
	case portainer.AgentOnDockerEnvironment:
		return manager.proxyFactory.newDockerHTTPSProxy(endpointURL, &endpoint.TLSConfig, true)
	case portainer.AzureEnvironment:
		return newAzureHTTPSPRoxy(&endpoint.AzureCredentials, &endpoint.TLSConfig)
	default:
		return manager.createDockerProxy(endpointURL, &endpoint.TLSConfig)
	}
}

// CreateAndRegisterProxy creates a new HTTP reverse proxy based on endpoint properties and and adds it to the registered proxies.
// It can also be used to create a new HTTP reverse proxy and replace an already registered proxy.
func (manager *Manager) CreateAndRegisterProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	proxy, err := manager.createProxy(endpoint)
	if err != nil {
		return nil, err
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

	proxy := manager.proxyFactory.newHTTPProxy(extensionURL)
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
