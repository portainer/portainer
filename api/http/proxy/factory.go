package proxy

import (
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
)

// proxyFactory is a factory to create reverse proxies to Docker endpoints
type proxyFactory struct {
	ResourceControlService portainer.ResourceControlService
	TeamMembershipService  portainer.TeamMembershipService
	SettingsService        portainer.SettingsService
}

func (factory *proxyFactory) newExtensionHTTPPRoxy(u *url.URL) http.Handler {
	u.Scheme = "http"
	return newSingleHostReverseProxyWithHostHeader(u)
}

func (factory *proxyFactory) newDockerHTTPSProxy(u *url.URL, endpoint *portainer.Endpoint) (http.Handler, error) {
	u.Scheme = "https"
	proxy := factory.createDockerReverseProxy(u)
	config, err := crypto.CreateTLSConfiguration(&endpoint.TLSConfig)
	if err != nil {
		return nil, err
	}

	proxy.Transport.(*proxyTransport).dockerTransport.TLSClientConfig = config
	return proxy, nil
}

func (factory *proxyFactory) newDockerHTTPProxy(u *url.URL) http.Handler {
	u.Scheme = "http"
	return factory.createDockerReverseProxy(u)
}

func (factory *proxyFactory) newDockerSocketProxy(path string) http.Handler {
	proxy := &socketProxy{}
	transport := &proxyTransport{
		ResourceControlService: factory.ResourceControlService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		dockerTransport:        newSocketTransport(path),
	}
	proxy.Transport = transport
	return proxy
}

func (factory *proxyFactory) createDockerReverseProxy(u *url.URL) *httputil.ReverseProxy {
	proxy := newSingleHostReverseProxyWithHostHeader(u)
	transport := &proxyTransport{
		ResourceControlService: factory.ResourceControlService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		dockerTransport:        &http.Transport{},
	}
	proxy.Transport = transport
	return proxy
}

func newSocketTransport(socketPath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			return net.Dial("unix", socketPath)
		},
	}
}
