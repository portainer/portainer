package websocket

import (
	"crypto/tls"
	"net"
	"net/url"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

func initDial(endpoint *portainer.Endpoint) (net.Conn, error) {
	url, err := url.Parse(endpoint.URL)
	if err != nil {
		return nil, err
	}

	host := url.Host

	if url.Scheme == "unix" || url.Scheme == "npipe" {
		host = url.Path
	}

	if !endpoint.TLSConfig.TLS {
		return createDial(url.Scheme, host)
	}

	tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig)
	if err != nil {
		return nil, err
	}

	return tls.Dial(url.Scheme, host, tlsConfig)
}
