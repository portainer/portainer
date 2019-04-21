package websocket

import (
	"crypto/tls"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"net"
	"net/url"
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

	if endpoint.TLSConfig.TLS {
		tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}

		return tls.Dial(url.Scheme, host, tlsConfig)
	}

	con, err := createDial(url.Scheme, host)

	return con, err
}
