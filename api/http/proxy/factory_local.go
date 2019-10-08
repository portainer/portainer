// +build !windows

package proxy

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

func (factory *proxyFactory) newLocalProxy(path string, endpoint *portainer.Endpoint) http.Handler {
	proxy := &localProxy{}
	transport := &proxyTransport{
		enableSignature:        false,
		ResourceControlService: factory.ResourceControlService,
		UserService:            factory.UserService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
		ExtensionService:       factory.ExtensionService,
		dockerTransport:        newSocketTransport(path),
		ReverseTunnelService:   factory.ReverseTunnelService,
		endpointIdentifier:     endpoint.ID,
		endpointType:           endpoint.Type,
	}
	proxy.Transport = transport
	return proxy
}
