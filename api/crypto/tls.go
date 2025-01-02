package crypto

import (
	"crypto/tls"
	"crypto/x509"
	"os"
)

// CreateTLSConfiguration creates a basic tls.Config with recommended TLS settings
func CreateTLSConfiguration() *tls.Config {
	return &tls.Config{
		MinVersion: tls.VersionTLS12,
		CipherSuites: []uint16{
			tls.TLS_AES_128_GCM_SHA256,
			tls.TLS_AES_256_GCM_SHA384,
			tls.TLS_CHACHA20_POLY1305_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
			tls.TLS_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,
			tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,
			tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,
		},
	}
}

// CreateTLSConfigurationFromBytes initializes a tls.Config using a CA certificate, a certificate and a key
// loaded from memory.
func CreateTLSConfigurationFromBytes(caCert, cert, key []byte, skipClientVerification, skipServerVerification bool) (*tls.Config, error) {
	config := CreateTLSConfiguration()
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

// CreateTLSConfigurationFromDisk initializes a tls.Config using a CA certificate, a certificate and a key
// loaded from disk.
func CreateTLSConfigurationFromDisk(caCertPath, certPath, keyPath string, skipServerVerification bool) (*tls.Config, error) {
	config := CreateTLSConfiguration()
	config.InsecureSkipVerify = skipServerVerification

	if certPath != "" && keyPath != "" {
		cert, err := tls.LoadX509KeyPair(certPath, keyPath)
		if err != nil {
			return nil, err
		}

		config.Certificates = []tls.Certificate{cert}
	}

	if !skipServerVerification && caCertPath != "" {
		caCert, err := os.ReadFile(caCertPath)
		if err != nil {
			return nil, err
		}

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)
		config.RootCAs = caCertPool
	}

	return config, nil
}
