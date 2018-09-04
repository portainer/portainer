// +build !windows

package proxy

import (
	"net/http"
)

func (factory *proxyFactory) newLocalProxy(path string) http.Handler {
	proxy := &localProxy{}
	transport := &proxyTransport{
		enableSignature:        false,
		ResourceControlService: factory.ResourceControlService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
		dockerTransport:        newSocketTransport(path),
	}
	proxy.Transport = transport
	return proxy
}
