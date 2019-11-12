// +build windows

package factory

import (
	"net"
	"net/http"

	"github.com/Microsoft/go-winio"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/docker"
)

func (factory ProxyFactory) newOSBasedLocalProxy(path string, endpoint *portainer.Endpoint) (http.Handler, error) {
	transportParameters := &docker.TransportParameters{
		Endpoint:               endpoint,
		ResourceControlService: factory.resourceControlService,
		UserService:            factory.userService,
		TeamService:            factory.teamService,
		TeamMembershipService:  factory.teamMembershipService,
		RegistryService:        factory.registryService,
		DockerHubService:       factory.dockerHubService,
		SettingsService:        factory.settingsService,
		ReverseTunnelService:   factory.reverseTunnelService,
		ExtensionService:       factory.extensionService,
		SignatureService:       factory.signatureService,
		DockerClientFactory:    factory.dockerClientFactory,
	}

	proxy := &dockerLocalProxy{}

	dockerTransport, err := docker.NewTransport(transportParameters, newSocketTransport(path))
	if err != nil {
		return nil, err
	}

	proxy.transport = dockerTransport
	return proxy, nil
}

func newNamedPipeTransport(namedPipePath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			return winio.DialPipe(namedPipePath, nil)
		},
	}
}
