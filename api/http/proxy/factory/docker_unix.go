//go:build aix || darwin || dragonfly || freebsd || linux || netbsd || openbsd || solaris

package factory

import (
	"context"
	"net"
	"net/http"

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

	dockerTransport, err := docker.NewTransport(transportParameters, newSocketTransport(path), factory.gitService, factory.snapshotService)
	if err != nil {
		return nil, err
	}

	proxy.transport = dockerTransport
	return proxy, nil
}

func newSocketTransport(socketPath string) *http.Transport {
	d := &net.Dialer{}
	t := ssrf.NewInternalTransport(nil)
	t.DialContext = func(ctx context.Context, _, _ string) (net.Conn, error) {
		return d.DialContext(ctx, "unix", socketPath)
	}

	return t
}
