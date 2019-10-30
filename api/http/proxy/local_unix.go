// +build aix darwin dragonfly freebsd linux netbsd openbsd solaris

package proxy

import (
	"net/http"

	"github.com/portainer/portainer/api/http/proxy/provider/docker"

	portainer "github.com/portainer/portainer/api"
)

func (factory proxyFactory) newLocalProxy(path string, endpoint *portainer.Endpoint) http.Handler {
	transportParameters := &docker.TransportParameters{
		EnableSignature:        false,
		EndpointIdentifier:     endpoint.ID,
		EndpointType:           endpoint.Type,
		ResourceControlService: factory.ResourceControlService,
		UserService:            factory.UserService,
		TeamMembershipService:  factory.TeamMembershipService,
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
		SettingsService:        factory.SettingsService,
		ReverseTunnelService:   factory.ReverseTunnelService,
		ExtensionService:       factory.ExtensionService,
		SignatureService:       nil,
	}

	proxy := &localProxy{}
	proxy.transport = docker.NewTransport(transportParameters, newSocketTransport(path))
	return proxy
}
