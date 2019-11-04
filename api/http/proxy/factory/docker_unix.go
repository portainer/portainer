// +build aix darwin dragonfly freebsd linux netbsd openbsd solaris

package factory

import (
	"net"
	"net/http"

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
	}

	dockerClient, err := factory.dockerClientFactory.CreateClient(endpoint, "")
	if err != nil {
		return nil, err
	}

	proxy := &dockerLocalProxy{}
	proxy.transport = docker.NewTransport(transportParameters, newSocketTransport(path), dockerClient)
	return proxy, nil
}

func newSocketTransport(socketPath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			return net.Dial("unix", socketPath)
		},
	}
}
