package factory

import (
	"fmt"
	"net"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/proxy/factory/agent"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/url"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

// ProxyServer provide an extended proxy with a local server to forward requests
type ProxyServer struct {
	server *http.Server
	Port   int
}

// NewAgentProxy creates a new instance of ProxyServer that wrap http requests with agent headers
func (factory *ProxyFactory) NewAgentProxy(endpoint *portainer.Endpoint) (*ProxyServer, error) {
	urlString := endpoint.URL

	if endpointutils.IsEdgeEndpoint(endpoint) {
		tunnel, err := factory.reverseTunnelService.GetActiveTunnel(endpoint)
		if err != nil {
			return nil, errors.Wrap(err, "failed starting tunnel")
		}

		urlString = fmt.Sprintf("http://127.0.0.1:%d", tunnel.Port)
	}

	endpointURL, err := url.ParseURL(urlString)
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
		log.Debug().Str("host", proxyHost).Msg("starting proxy server")

		err := proxy.server.Serve(listener)
		log.Debug().Str("host", proxyHost).Msg("exiting proxy server")

		if err != nil && err != http.ErrServerClosed {
			log.Debug().Str("host", proxyHost).Err(err).Msg("proxy server exited with an error")
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
