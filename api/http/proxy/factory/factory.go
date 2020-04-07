package factory

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
)

const azureAPIBaseURL = "https://management.azure.com"

var extensionPorts = map[portainer.ExtensionID]string{
	portainer.RegistryManagementExtension:  "7001",
	portainer.OAuthAuthenticationExtension: "7002",
	portainer.RBACExtension:                "7003",
}

type (
	// ProxyFactory is a factory to create reverse proxies to Docker endpoints and extensions
	ProxyFactory struct {
		resourceControlService portainer.ResourceControlService
		userService            portainer.UserService
		teamService            portainer.TeamService
		teamMembershipService  portainer.TeamMembershipService
		settingsService        portainer.SettingsService
		registryService        portainer.RegistryService
		dockerHubService       portainer.DockerHubService
		signatureService       portainer.DigitalSignatureService
		reverseTunnelService   portainer.ReverseTunnelService
		extensionService       portainer.ExtensionService
		dockerClientFactory    *docker.ClientFactory
	}

	// ProxyFactoryParameters is used to create a new ProxyFactory
	ProxyFactoryParameters struct {
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

// NewProxyFactory returns a pointer to a new instance of a ProxyFactory
func NewProxyFactory(parameters *ProxyFactoryParameters) *ProxyFactory {
	return &ProxyFactory{
		resourceControlService: parameters.ResourceControlService,
		userService:            parameters.UserService,
		teamService:            parameters.TeamService,
		teamMembershipService:  parameters.TeamMembershipService,
		settingsService:        parameters.SettingsService,
		registryService:        parameters.RegistryService,
		dockerHubService:       parameters.DockerHubService,
		signatureService:       parameters.SignatureService,
		reverseTunnelService:   parameters.ReverseTunnelService,
		extensionService:       parameters.ExtensionService,
		dockerClientFactory:    parameters.DockerClientFactory,
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
	}

	return factory.newDockerProxy(endpoint)
}

// NewGitlabProxy returns a new HTTP proxy to a Gitlab API server
func (factory *ProxyFactory) NewGitlabProxy(gitlabAPIUri string) (http.Handler, error) {
	return newGitlabProxy(gitlabAPIUri)
}
