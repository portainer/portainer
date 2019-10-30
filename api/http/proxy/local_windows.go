// +build windows

package proxy

import (
	"net"
	"net/http"

	"github.com/portainer/portainer/api/http/proxy/provider/docker"

	"github.com/Microsoft/go-winio"

	portainer "github.com/portainer/portainer/api"
)

func (factory proxyFactory) newLocalProxy(path string, endpoint *portainer.Endpoint) (http.Handler, error) {
	transportParameters := &docker.TransportParameters{
		Endpoint:               endpoint,
		ResourceControlService: factory.ResourceControlService,
		UserService:            factory.UserService,
		TeamMembershipService:  factory.TeamMembershipService,
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
		SettingsService:        factory.SettingsService,
		ReverseTunnelService:   factory.ReverseTunnelService,
		ExtensionService:       factory.ExtensionService,
		SignatureService:       factory.SignatureService,
		DockerClientFactory:    factory.DockerClientFactory,
	}

	dockerClient, err := factory.DockerClientFactory.CreateClient(endpoint, "")
	if err != nil {
		return nil, err
	}

	proxy := &localProxy{}
	proxy.transport = docker.NewTransport(transportParameters, newNamedPipeTransport(path), dockerClient)
	return proxy, nil
}

func newNamedPipeTransport(namedPipePath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			return winio.DialPipe(namedPipePath, nil)
		},
	}
}
