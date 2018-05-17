package crypto

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
)

// TODO: rename to CreateTLSConfigurationFromBytes
func CreateTLSConfig(caCert, cert, key []byte, skipClientVerification, skipServerVerification bool) (*tls.Config, error) {
	config := &tls.Config{}
	config.InsecureSkipVerify = skipServerVerification

	if !skipClientVerification {
		certificate, err := tls.X509KeyPair(cert, key)
		if err != nil {
			return nil, err
		}
		config.Certificates = []tls.Certificate{certificate}
	}

	if !skipServerVerification {
		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)
		config.RootCAs = caCertPool
	}

	return config, nil
}

func CreateTLSConfigurationFromDisk(caCertPath, certPath, keyPath string, skipServerVerification bool) (*tls.Config, error) {
	config := &tls.Config{}
	config.InsecureSkipVerify = skipServerVerification

	if certPath != "" && keyPath != "" {
		cert, err := tls.LoadX509KeyPair(certPath, keyPath)
		if err != nil {
			return nil, err
		}

		config.Certificates = []tls.Certificate{cert}
	}

	if !skipServerVerification && caCertPath != "" {
		caCert, err := ioutil.ReadFile(caCertPath)
		if err != nil {
			return nil, err
		}

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)
		config.RootCAs = caCertPool
	}

	return config, nil
}

// TODO: Deprecated, remove it.
// CreateTLSConfiguration initializes a tls.Config using a CA certificate, a certificate and a key
// func CreateTLSConfiguration(config *portainer.TLSConfiguration) (*tls.Config, error) {
// 	TLSConfig := &tls.Config{}
//
// 	if config.TLS && config.TLSCertPath != "" && config.TLSKeyPath != "" {
// 		cert, err := tls.LoadX509KeyPair(config.TLSCertPath, config.TLSKeyPath)
// 		if err != nil {
// 			return nil, err
// 		}
//
// 		TLSConfig.Certificates = []tls.Certificate{cert}
// 	}
//
// 	if config.TLS && !config.TLSSkipVerify {
// 		caCert, err := ioutil.ReadFile(config.TLSCACertPath)
// 		if err != nil {
// 			return nil, err
// 		}
//
// 		caCertPool := x509.NewCertPool()
// 		caCertPool.AppendCertsFromPEM(caCert)
//
// 		TLSConfig.RootCAs = caCertPool
// 	}
//
// 	TLSConfig.InsecureSkipVerify = config.TLSSkipVerify
//
// 	return TLSConfig, nil
// }
