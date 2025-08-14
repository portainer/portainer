package crypto

import (
	"crypto/tls"
	"crypto/x509"
	"os"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"
)

// CreateTLSConfiguration creates a basic tls.Config with recommended TLS settings
func CreateTLSConfiguration(insecureSkipVerify bool) *tls.Config { //nolint:forbidigo
	return createTLSConfiguration(fips.FIPSMode(), insecureSkipVerify)
}

func createTLSConfiguration(fipsEnabled bool, insecureSkipVerify bool) *tls.Config { //nolint:forbidigo
	if fipsEnabled {
		return &tls.Config{ //nolint:forbidigo
			MinVersion: tls.VersionTLS12,
			MaxVersion: tls.VersionTLS13,
			CipherSuites: []uint16{
				tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
				tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
				tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
				tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			},
			CurvePreferences: []tls.CurveID{tls.CurveP256, tls.CurveP384, tls.CurveP521},
		}
	}

	return &tls.Config{ //nolint:forbidigo
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
		InsecureSkipVerify: insecureSkipVerify, //nolint:forbidigo
	}
}

// CreateTLSConfigurationFromBytes initializes a tls.Config using a CA certificate, a certificate and a key
// loaded from memory.
func CreateTLSConfigurationFromBytes(useTLS bool, caCert, cert, key []byte, skipClientVerification, skipServerVerification bool) (*tls.Config, error) { //nolint:forbidigo
	return createTLSConfigurationFromBytes(fips.FIPSMode(), useTLS, caCert, cert, key, skipClientVerification, skipServerVerification)
}

func createTLSConfigurationFromBytes(fipsEnabled, useTLS bool, caCert, cert, key []byte, skipClientVerification, skipServerVerification bool) (*tls.Config, error) { //nolint:forbidigo
	if !useTLS {
		return nil, nil
	}

	config := createTLSConfiguration(fipsEnabled, skipServerVerification)

	if !skipClientVerification || fipsEnabled {
		certificate, err := tls.X509KeyPair(cert, key)
		if err != nil {
			return nil, err
		}

		config.Certificates = []tls.Certificate{certificate}
	}

	if !skipServerVerification || fipsEnabled {
		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)
		config.RootCAs = caCertPool
	}

	return config, nil
}

// CreateTLSConfigurationFromDisk initializes a tls.Config using a CA certificate, a certificate and a key
// loaded from disk.
func CreateTLSConfigurationFromDisk(config portainer.TLSConfiguration) (*tls.Config, error) { //nolint:forbidigo
	return createTLSConfigurationFromDisk(fips.FIPSMode(), config)
}

func createTLSConfigurationFromDisk(fipsEnabled bool, config portainer.TLSConfiguration) (*tls.Config, error) { //nolint:forbidigo
	if !config.TLS {
		return nil, nil
	}

	tlsConfig := createTLSConfiguration(fipsEnabled, config.TLSSkipVerify)

	if config.TLSCertPath != "" && config.TLSKeyPath != "" {
		cert, err := tls.LoadX509KeyPair(config.TLSCertPath, config.TLSKeyPath)
		if err != nil {
			return nil, err
		}

		tlsConfig.Certificates = []tls.Certificate{cert}
	}

	if !tlsConfig.InsecureSkipVerify && config.TLSCACertPath != "" { //nolint:forbidigo
		caCert, err := os.ReadFile(config.TLSCACertPath)
		if err != nil {
			return nil, err
		}

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)
		tlsConfig.RootCAs = caCertPool
	}

	return tlsConfig, nil
}
