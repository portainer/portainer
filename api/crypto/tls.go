package crypto

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
)

// CreateTLSConfiguration initializes a tls.Config using a CA certificate, a certificate and a key
func CreateTLSConfiguration(caCertPath, certPath, keyPath string, skipTLSVerify bool) (*tls.Config, error) {

	config := &tls.Config{}

	if certPath != "" && keyPath != "" {
		cert, err := tls.LoadX509KeyPair(certPath, keyPath)
		if err != nil {
			return nil, err
		}
		config.Certificates = []tls.Certificate{cert}
	}

	if caCertPath != "" {
		caCert, err := ioutil.ReadFile(caCertPath)
		if err != nil {
			return nil, err
		}
		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)
		config.RootCAs = caCertPool
	}

	config.InsecureSkipVerify = skipTLSVerify
	return config, nil
}
