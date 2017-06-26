package crypto

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
)

// CreateTLSConfiguration initializes a tls.Config using a CA certificate, a certificate and a key
func CreateTLSConfiguration(tlsVerify, tlsClientCert bool, caCertPath, certPath, keyPath string) (*tls.Config, error) {
	config := &tls.Config{}

	if tlsClientCert {
		cert, err := tls.LoadX509KeyPair(certPath, keyPath)
		if err != nil {
			return nil, err
		}

		config.Certificates = []tls.Certificate{cert}
	}

	if tlsVerify {
		caCert, err := ioutil.ReadFile(caCertPath)
		if err != nil {
			return nil, err
		}

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		config.RootCAs = caCertPool
		config.InsecureSkipVerify = false
	} else {
		config.InsecureSkipVerify = true
	}

	return config, nil
}
