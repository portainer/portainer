package proxy

import (
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/Microsoft/go-winio"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
)

// proxyFactory is a factory to create reverse proxies to Docker endpoints
type proxyFactory struct {
	ResourceControlService portainer.ResourceControlService
	TeamMembershipService  portainer.TeamMembershipService
	SettingsService        portainer.SettingsService
}

func (factory *proxyFactory) newHTTPProxy(u *url.URL) http.Handler {
	u.Scheme = "http"
	return factory.createReverseProxy(u)
}

func (factory *proxyFactory) newHTTPSProxy(u *url.URL, endpoint *portainer.Endpoint) (http.Handler, error) {
	u.Scheme = "https"
	proxy := factory.createReverseProxy(u)
	config, err := crypto.CreateTLSConfiguration(&endpoint.TLSConfig)
	if err != nil {
		return nil, err
	}

	proxy.Transport.(*proxyTransport).dockerTransport.TLSClientConfig = config
	return proxy, nil
}

func (factory *proxyFactory) newSocketProxy(path string) http.Handler {
	proxy := &localProxy{}
	transport := &proxyTransport{
		ResourceControlService: factory.ResourceControlService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		dockerTransport:        newSocketTransport(path),
	}
	proxy.Transport = transport
	return proxy
}

func (factory *proxyFactory) createReverseProxy(u *url.URL) *httputil.ReverseProxy {
	proxy := newSingleHostReverseProxyWithHostHeader(u)
	transport := &proxyTransport{
		ResourceControlService: factory.ResourceControlService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		dockerTransport:        newHTTPTransport(),
	}
	proxy.Transport = transport
	return proxy
}

func (factory *proxyFactory) newNamedPipeProxy(path string) http.Handler {
	proxy := &localProxy{}
	transport := &proxyTransport{
		ResourceControlService: factory.ResourceControlService,
		TeamMembershipService:  factory.TeamMembershipService,
		SettingsService:        factory.SettingsService,
		dockerTransport:        newNamedPipeTransport(path),
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

func newHTTPTransport() *http.Transport {
	return &http.Transport{}
}

func newNamedPipeTransport(namedPipePath string) *http.Transport {
	return &http.Transport{
		Dial: func(proto, addr string) (conn net.Conn, err error) {
			attempts := 3
			for {
				attempts--
				conn, err = winio.DialPipe(namedPipePath, nil)
				if attempts > 0 && err != nil {
					time.Sleep(10 * time.Millisecond)
				} else {
					break
				}
			}
			return conn, err
		},
	}
}
