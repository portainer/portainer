package proxy

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer/api"
)

// TODO: contain code related to legacy extension management

var extensionPorts = map[portainer.ExtensionID]string{
	portainer.RegistryManagementExtension:  "7001",
	portainer.OAuthAuthenticationExtension: "7002",
	portainer.RBACExtension:                "7003",
}

type (
	// Manager represents a service used to manage Docker proxies.
	Manager struct {
		proxyFactory           *proxyFactory
		reverseTunnelService   portainer.ReverseTunnelService
		proxies                cmap.ConcurrentMap
		extensionProxies       cmap.ConcurrentMap
		legacyExtensionProxies cmap.ConcurrentMap
	}

	// ManagerParams represents the required parameters to create a new Manager instance.
	ManagerParams struct {
		ResourceControlService portainer.ResourceControlService
		UserService            portainer.UserService
		TeamMembershipService  portainer.TeamMembershipService
		SettingsService        portainer.SettingsService
		RegistryService        portainer.RegistryService
		DockerHubService       portainer.DockerHubService
		SignatureService       portainer.DigitalSignatureService
		ReverseTunnelService   portainer.ReverseTunnelService
		ExtensionService       portainer.ExtensionService
	}
)

// NewManager initializes a new proxy Service
func NewManager(parameters *ManagerParams) *Manager {
	return &Manager{
		proxies:                cmap.New(),
		extensionProxies:       cmap.New(),
		legacyExtensionProxies: cmap.New(),
		proxyFactory: &proxyFactory{
			ResourceControlService: parameters.ResourceControlService,
			UserService:            parameters.UserService,
			TeamMembershipService:  parameters.TeamMembershipService,
			SettingsService:        parameters.SettingsService,
			RegistryService:        parameters.RegistryService,
			DockerHubService:       parameters.DockerHubService,
			SignatureService:       parameters.SignatureService,
			ReverseTunnelService:   parameters.ReverseTunnelService,
			ExtensionService:       parameters.ExtensionService,
		},
		reverseTunnelService: parameters.ReverseTunnelService,
	}
}

// GetProxy returns the proxy associated to a key
func (manager *Manager) GetProxy(endpoint *portainer.Endpoint) http.Handler {
	proxy, ok := manager.proxies.Get(string(endpoint.ID))
	if !ok {
		return nil
	}
	return proxy.(http.Handler)
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

// DeleteProxy deletes the proxy associated to a key
func (manager *Manager) DeleteProxy(endpoint *portainer.Endpoint) {
	manager.proxies.Remove(string(endpoint.ID))
}

// GetExtensionProxy returns an extension proxy associated to an extension identifier
func (manager *Manager) GetExtensionProxy(extensionID portainer.ExtensionID) http.Handler {
	proxy, ok := manager.extensionProxies.Get(strconv.Itoa(int(extensionID)))
	if !ok {
		return nil
	}
	return proxy.(http.Handler)
}

// CreateExtensionProxy creates a new HTTP reverse proxy for an extension and
// registers it in the extension map associated to the specified extension identifier
func (manager *Manager) CreateExtensionProxy(extensionID portainer.ExtensionID) (http.Handler, error) {
	address := "http://" + portainer.ExtensionServer + ":" + extensionPorts[extensionID]

	extensionURL, err := url.Parse(address)
	if err != nil {
		return nil, err
	}

	proxy := manager.proxyFactory.newHTTPProxy(extensionURL)
	manager.extensionProxies.Set(strconv.Itoa(int(extensionID)), proxy)

	return proxy, nil
}

// GetExtensionURL retrieves the URL of an extension running locally based on the extension port table
func (manager *Manager) GetExtensionURL(extensionID portainer.ExtensionID) string {
	return "http://localhost:" + extensionPorts[extensionID]
}

// DeleteExtensionProxy deletes the extension proxy associated to an extension identifier
func (manager *Manager) DeleteExtensionProxy(extensionID portainer.ExtensionID) {
	manager.extensionProxies.Remove(strconv.Itoa(int(extensionID)))
}

// GetLegacyExtensionProxy returns a legacy extension proxy associated to a key
func (manager *Manager) GetLegacyExtensionProxy(key string) http.Handler {
	proxy, ok := manager.legacyExtensionProxies.Get(key)
	if !ok {
		return nil
	}
	return proxy.(http.Handler)
}

// CreateLegacyExtensionProxy creates a new HTTP reverse proxy for a legacy extension and adds it to the registered proxies.
func (manager *Manager) CreateLegacyExtensionProxy(key, extensionAPIURL string) (http.Handler, error) {
	extensionURL, err := url.Parse(extensionAPIURL)
	if err != nil {
		return nil, err
	}

	proxy := manager.proxyFactory.newHTTPProxy(extensionURL)
	manager.legacyExtensionProxies.Set(key, proxy)
	return proxy, nil
}

func (manager *Manager) createDockerProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	baseURL := endpoint.URL
	if endpoint.Type == portainer.EdgeAgentEnvironment {
		tunnel := manager.reverseTunnelService.GetTunnelDetails(endpoint.ID)
		baseURL = fmt.Sprintf("http://localhost:%d", tunnel.Port)
	}

	endpointURL, err := url.Parse(baseURL)
	if err != nil {
		return nil, err
	}

	switch endpoint.Type {
	case portainer.AgentOnDockerEnvironment:
		return manager.proxyFactory.newDockerHTTPSProxy(endpointURL, &endpoint.TLSConfig, endpoint)
	case portainer.EdgeAgentEnvironment:
		return manager.proxyFactory.newDockerHTTPProxy(endpointURL, endpoint), nil
	}

	if endpointURL.Scheme == "tcp" {
		if endpoint.TLSConfig.TLS || endpoint.TLSConfig.TLSSkipVerify {
			return manager.proxyFactory.newDockerHTTPSProxy(endpointURL, &endpoint.TLSConfig, endpoint)
		}

		return manager.proxyFactory.newDockerHTTPProxy(endpointURL, endpoint), nil
	}

	return manager.proxyFactory.newLocalProxy(endpointURL.Path, endpoint), nil
}

func (manager *Manager) createProxy(endpoint *portainer.Endpoint) (http.Handler, error) {
	if endpoint.Type == portainer.AzureEnvironment {
		return newAzureProxy(&endpoint.AzureCredentials)
	}

	return manager.createDockerProxy(endpoint)
}
