// +build !windows

package proxy

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

func (factory *proxyFactory) newLocalProxy(path string, endpointID portainer.EndpointID) http.Handler {
	proxy := &localProxy{}
	transport := &proxyTransport{
		enableSignature:        false,
		ResourceControlService: factory.ResourceControlService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
		dockerTransport:        newSocketTransport(path),
		endpointIdentifier:     endpointID,
	}
	proxy.Transport = transport
	return proxy
}
