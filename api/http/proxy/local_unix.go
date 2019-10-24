// +build aix darwin dragonfly freebsd linux netbsd openbsd solaris

package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api/http/proxy/provider/docker"

	portainer "github.com/portainer/portainer/api"
)

func (factory proxyFactory) newLocalProxy(path string, endpoint *portainer.Endpoint) http.Handler {
	proxy := &localProxy{}
	transport := &docker.ProxyTransport{
		EnableSignature:        false,
		ResourceControlService: factory.ResourceControlService,
		UserService:            factory.UserService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
		ExtensionService:       factory.ExtensionService,
		HTTPTransport:          newSocketTransport(path),
		ReverseTunnelService:   factory.ReverseTunnelService,
		EndpointIdentifier:     endpoint.ID,
		EndpointType:           endpoint.Type,
	}
	proxy.Transport = transport
	return proxy
}
