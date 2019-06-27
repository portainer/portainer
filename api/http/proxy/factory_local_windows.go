// +build windows

package proxy

import (
	"net"
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
		ReverseTunnelService:   factory.ReverseTunnelService,
		dockerTransport:        newNamedPipeTransport(path),
		endpointIdentifier:     endpointID,
	}
	proxy.Transport = transport
	return proxy
}

func newNamedPipeTransport(namedPipePath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			return winio.DialPipe(namedPipePath, nil)
		},
	}
}
