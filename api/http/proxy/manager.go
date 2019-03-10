package proxy

import (
	"net/http"
	"net/url"
	"strconv"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer"
)

// TODO: contain code related to legacy extension management

var extensionPorts = map[portainer.ExtensionID]string{
	portainer.RegistryManagementExtension:  "7001",
	portainer.OAuthAuthenticationExtension: "7002",
}

type (
	// Manager represents a service used to manage Docker proxies.
	Manager struct {
		proxyFactory           *proxyFactory
		proxies                cmap.ConcurrentMap
		extensionProxies       cmap.ConcurrentMap
		legacyExtensionProxies cmap.ConcurrentMap
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
		proxies:                cmap.New(),
		extensionProxies:       cmap.New(),
		legacyExtensionProxies: cmap.New(),
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

// GetProxy returns the proxy associated to a key
func (manager *Manager) GetProxy(key string) http.Handler {
	proxy, ok := manager.proxies.Get(key)
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
func (manager *Manager) DeleteProxy(key string) {
	manager.proxies.Remove(key)
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
	address := "http://localhost:" + extensionPorts[extensionID]

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
	manager.extensionProxies.Set(key, proxy)
	return proxy, nil
}

func (manager *Manager) createDockerProxy(endpointURL *url.URL, tlsConfig *portainer.TLSConfiguration) (http.Handler, error) {
	if endpointURL.Scheme == "tcp" {
		if tlsConfig.TLS || tlsConfig.TLSSkipVerify {
			return manager.proxyFactory.newDockerHTTPSProxy(endpointURL, tlsConfig, false)
		}
		return manager.proxyFactory.newDockerHTTPProxy(endpointURL, false), nil
	}
	return manager.proxyFactory.newLocalProxy(endpointURL.Path), nil
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
		return newAzureProxy(&endpoint.AzureCredentials)
	default:
		return manager.createDockerProxy(endpointURL, &endpoint.TLSConfig)
	}
}
