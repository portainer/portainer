//go:build windows
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
		Endpoint:             endpoint,
		DataStore:            factory.dataStore,
		ReverseTunnelService: factory.reverseTunnelService,
		SignatureService:     factory.signatureService,
		DockerClientFactory:  factory.dockerClientFactory,
	}

	proxy := &dockerLocalProxy{}

	dockerTransport, err := docker.NewTransport(transportParameters, newNamedPipeTransport(path))
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
