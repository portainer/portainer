package factory

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"
	"strings"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/proxy/factory/agent"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

// ProxyServer provide an extended proxy with a local server to forward requests
type ProxyServer struct {
	server *http.Server
	Port   int
}

// NewAgentProxy creates a new instance of ProxyServer that wrap http requests with agent headers
func (factory *ProxyFactory) NewAgentProxy(endpoint *portainer.Endpoint) (*ProxyServer, error) {
	urlString := endpoint.URL

	if endpointutils.IsEdgeEndpoint((endpoint)) {
		tunnel, err := factory.reverseTunnelService.GetActiveTunnel(endpoint)
		if err != nil {
			return nil, errors.Wrap(err, "failed starting tunnel")
		}

		urlString = fmt.Sprintf("http://127.0.0.1:%d", tunnel.Port)
	}

	endpointURL, err := parseURL(urlString)
	if err != nil {
		return nil, errors.Wrapf(err, "failed parsing url %s", endpoint.URL)
	}

	endpointURL.Scheme = "http"
	httpTransport := &http.Transport{}

	if endpoint.TLSConfig.TLS || endpoint.TLSConfig.TLSSkipVerify {
		config, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, errors.WithMessage(err, "failed generating tls configuration")
		}

		httpTransport.TLSClientConfig = config
		endpointURL.Scheme = "https"
	}

	proxy := newSingleHostReverseProxyWithHostHeader(endpointURL)

	proxy.Transport = agent.NewTransport(factory.signatureService, httpTransport)

	proxyServer := &ProxyServer{
		server: &http.Server{
			Handler: proxy,
		},
		Port: 0,
	}

	err = proxyServer.start()
	if err != nil {
		return nil, errors.Wrap(err, "failed starting proxy server")
	}

	return proxyServer, nil
}

func (proxy *ProxyServer) start() error {
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		return err
	}

	proxy.Port = listener.Addr().(*net.TCPAddr).Port
	go func() {
		proxyHost := fmt.Sprintf("127.0.0.1:%d", proxy.Port)
		log.Printf("Starting Proxy server on %s...\n", proxyHost)

		err := proxy.server.Serve(listener)
		log.Printf("Exiting Proxy server %s\n", proxyHost)

		if err != nil && err != http.ErrServerClosed {
			log.Printf("Proxy server %s exited with an error: %s\n", proxyHost, err)
		}
	}()

	return nil
}

// Close shuts down the server
func (proxy *ProxyServer) Close() {
	if proxy.server != nil {
		proxy.server.Close()
	}
}

// parseURL parses the endpointURL using url.Parse.
//
// to prevent an error when url has port but no protocol prefix
// we add `//` prefix if needed
func parseURL(endpointURL string) (*url.URL, error) {
	if !strings.HasPrefix(endpointURL, "http") && !strings.HasPrefix(endpointURL, "tcp") && !strings.HasPrefix(endpointURL, "//") {
		endpointURL = fmt.Sprintf("//%s", endpointURL)
	}

	return url.Parse(endpointURL)
}
