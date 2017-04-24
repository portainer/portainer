package tmp

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
)

// createTLSConfiguration initializes a tls.Config using a CA certificate, a certificate and a key
func createTLSConfiguration(caCertPath, certPath, keyPath string) (*tls.Config, error) {
	cert, err := tls.LoadX509KeyPair(certPath, keyPath)
	if err != nil {
		return nil, err
	}
	caCert, err := ioutil.ReadFile(caCertPath)
	if err != nil {
		return nil, err
	}
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)
	config := &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      caCertPool,
	}
	return config, nil
}
