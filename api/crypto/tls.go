package crypto

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"

	"github.com/portainer/portainer"
)

// CreateTLSConfiguration initializes a tls.Config using a CA certificate, a certificate and a key
func CreateTLSConfiguration(config *portainer.TLSConfiguration) (*tls.Config, error) {
	TLSConfig := &tls.Config{}

	if config.TLSCertPath != "" && config.TLSKeyPath != "" {
		cert, err := tls.LoadX509KeyPair(config.TLSCertPath, config.TLSKeyPath)
		if err != nil {
			return nil, err
		}

		TLSConfig.Certificates = []tls.Certificate{cert}
	}

	if !config.TLSSkipVerify {
		caCert, err := ioutil.ReadFile(config.TLSCACertPath)
		if err != nil {
			return nil, err
		}

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		TLSConfig.RootCAs = caCertPool
	}

	TLSConfig.InsecureSkipVerify = config.TLSSkipVerify

	return TLSConfig, nil
}
