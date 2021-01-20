package factory

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/proxy/factory/dockercompose"
)

// ProxyServer provide an extedned proxy with a local server to forward requests
type ProxyServer struct {
	server http.Server
	Port   int
}

func (factory *ProxyFactory) NewDockerComposeAgentProxy(endpoint *portainer.Endpoint) (*ProxyServer, error) {

	endpointURL, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	endpointURL.Scheme = "http"
	httpTransport := &http.Transport{}

	if endpoint.TLSConfig.TLS || endpoint.TLSConfig.TLSSkipVerify {
		config, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}

		httpTransport.TLSClientConfig = config
		endpointURL.Scheme = "https"
	}

	proxy := newSingleHostReverseProxyWithHostHeader(endpointURL)

	proxy.Transport = dockercompose.NewAgentTransport(factory.signatureService, httpTransport)

	proxyServer := &ProxyServer{
		http.Server{
			Handler: proxy,
		},
		0,
	}

	return proxyServer, proxyServer.Start()
}

func (factory *ProxyFactory) GetReverseTunnel(endpoint *portainer.Endpoint) *portainer.TunnelDetails {
	return factory.reverseTunnelService.GetTunnelDetails(endpoint.ID)
}

func (proxy *ProxyServer) Start() error {
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		return err
	}

	shutdownChan := make(chan error, 1)
	proxy.Port = listener.Addr().(*net.TCPAddr).Port
	go func() {

		log.Printf("Starting Proxy server on %s...\n", fmt.Sprintf("http://127.0.0.1:%d", proxy.Port))

		err := proxy.server.Serve(listener)
		log.Printf("Proxy Server exited with '%v' error\n", err)

		if err != http.ErrServerClosed {
			log.Printf("Put '%v' error returned by Proxy Server to shutdown channel\n", proxy.Port)
			shutdownChan <- err
		}
	}()

	return nil
}

// Close the server proxy
func (proxy *ProxyServer) Close() {
	proxy.server.Close()
}
