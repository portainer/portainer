package proxy

import (
	"net/http"
	"strconv"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/proxy/factory"
)

// TODO: contain code related to legacy extension management

type (
	// Manager represents a service used to manage proxies to endpoints and extensions.
	Manager struct {
		proxyFactory           *factory.ProxyFactory
		endpointProxies        cmap.ConcurrentMap
		extensionProxies       cmap.ConcurrentMap
		legacyExtensionProxies cmap.ConcurrentMap
	}

	// ManagerParams represents the required parameters to create a new Manager instance.
	ManagerParams struct {
		ResourceControlService portainer.ResourceControlService
		UserService            portainer.UserService
		TeamService            portainer.TeamService
		TeamMembershipService  portainer.TeamMembershipService
		SettingsService        portainer.SettingsService
		RegistryService        portainer.RegistryService
		DockerHubService       portainer.DockerHubService
		SignatureService       portainer.DigitalSignatureService
		ReverseTunnelService   portainer.ReverseTunnelService
		ExtensionService       portainer.ExtensionService
		DockerClientFactory    *docker.ClientFactory
	}
)

// NewManager initializes a new proxy Service
func NewManager(parameters *ManagerParams) *Manager {
	proxyFactoryParameters := &factory.ProxyFactoryParameters{
		ResourceControlService: parameters.ResourceControlService,
		UserService:            parameters.UserService,
		TeamService:            parameters.TeamService,
		TeamMembershipService:  parameters.TeamMembershipService,
		SettingsService:        parameters.SettingsService,
		RegistryService:        parameters.RegistryService,
		DockerHubService:       parameters.DockerHubService,
		SignatureService:       parameters.SignatureService,
		ReverseTunnelService:   parameters.ReverseTunnelService,
		ExtensionService:       parameters.ExtensionService,
		DockerClientFactory:    parameters.DockerClientFactory,
	}

	return &Manager{
		endpointProxies:        cmap.New(),
		extensionProxies:       cmap.New(),
		legacyExtensionProxies: cmap.New(),
		proxyFactory:           factory.NewProxyFactory(proxyFactoryParameters),
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

// CreateExtensionProxy creates a new HTTP reverse proxy for an extension and
// registers it in the extension map associated to the specified extension identifier
func (manager *Manager) CreateExtensionProxy(extensionID portainer.ExtensionID) (http.Handler, error) {
	proxy, err := manager.proxyFactory.NewExtensionProxy(extensionID)
	if err != nil {
		return nil, err
	}

	manager.extensionProxies.Set(strconv.Itoa(int(extensionID)), proxy)
	return proxy, nil
}

// GetExtensionProxy returns an extension proxy associated to an extension identifier
func (manager *Manager) GetExtensionProxy(extensionID portainer.ExtensionID) http.Handler {
	proxy, ok := manager.extensionProxies.Get(strconv.Itoa(int(extensionID)))
	if !ok {
		return nil
	}

	return proxy.(http.Handler)
}

// GetExtensionURL retrieves the URL of an extension running locally based on the extension port table
func (manager *Manager) GetExtensionURL(extensionID portainer.ExtensionID) string {
	return factory.BuildExtensionURL(extensionID)
}

// DeleteExtensionProxy deletes the extension proxy associated to an extension identifier
func (manager *Manager) DeleteExtensionProxy(extensionID portainer.ExtensionID) {
	manager.extensionProxies.Remove(strconv.Itoa(int(extensionID)))
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
