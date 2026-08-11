//go:build windows

package factory

import (
	"context"
	"net"
	"net/http"

	"github.com/Microsoft/go-winio"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/docker"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
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

	dockerTransport, err := docker.NewTransport(transportParameters, newNamedPipeTransport(path), factory.gitService, factory.snapshotService)
	if err != nil {
		return nil, err
	}

	proxy.transport = dockerTransport
	return proxy, nil
}

func newNamedPipeTransport(namedPipePath string) *http.Transport {
	t := ssrf.NewInternalTransport(nil)
	t.DialContext = func(_ context.Context, _, _ string) (net.Conn, error) {
		return winio.DialPipe(namedPipePath, nil)
	}

	return t
}
