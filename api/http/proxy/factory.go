package proxy

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
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
	RegistryService        portainer.RegistryService
	DockerHubService       portainer.DockerHubService
}

func (factory *proxyFactory) newExtensionHTTPPRoxy(u *url.URL) http.Handler {
	u.Scheme = "http"
	return newSingleHostReverseProxyWithHostHeader(u)
}

func (factory *proxyFactory) newRegistryProxy(u *url.URL, registry *portainer.Registry) http.Handler {
	u.Scheme = registry.Protocol
	transport := &http.Transport{}
	if registry.TLSVerification {
		transport.TLSClientConfig = &tls.Config{
                        InsecureSkipVerify: true,
                }
	}
	proxy := newSingleHostReverseProxyWithHostHeader(u)
	switch registry.AuthType {
		case "Basic":
			auth := base64.StdEncoding.EncodeToString([]byte(registry.Username + ":" + registry.Password))
			proxy = newSingleHostReverseProxyWithHostHeaderBasicAuth(u, auth)
		case "":
		default:
			fmt.Printf("Auth Type %s not yet supported.", registry.AuthType)
			return nil
	}

	proxy.Transport = transport
	return proxy
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
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
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
		RegistryService:        factory.RegistryService,
		DockerHubService:       factory.DockerHubService,
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
