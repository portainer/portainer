package crypto

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"

	"github.com/portainer/portainer"
)

// func tmpCreateTLSConfiguration(caCertPath, certPath, keyPath string, skipTLSVerify bool) (*tls.Config, error) {
//
// 	config := &tls.Config{}
//
// 	if certPath != "" && keyPath != "" {
//
// 		cert, err := tls.LoadX509KeyPair(certPath, keyPath)
// 		if err != nil {
// 			return nil, err
// 		}
//
// 		config.Certificates = []tls.Certificate{cert}
// 	}
//
// 	if caCertPath != "" {
//
// 		caCert, err := ioutil.ReadFile(caCertPath)
// 		if err != nil {
// 			return nil, err
// 		}
//
// 		caCertPool := x509.NewCertPool()
// 		caCertPool.AppendCertsFromPEM(caCert)
// 		config.RootCAs = caCertPool
// 	}
//
// 	config.InsecureSkipVerify = skipTLSVerify
//
// 	return config, nil
// }

// CreateTLSConfigurationV2 initializes a tls.Config using a CA certificate, a certificate and a key
func CreateTLSConfigurationV2(config *portainer.TLSConfiguration) (*tls.Config, error) {
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
