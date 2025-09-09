package registryhttp

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
)

// BuildTransportAndSchemeFromTLSConfig returns a base HTTP transport configured
// with ProxyFromEnvironment and, when needed, a TLSClientConfig derived from the
// provided TLS settings. It also returns the scheme ("http" or "https") that
// should be used to contact the registry based on the TLS settings.
func BuildTransportAndSchemeFromTLSConfig(tlsCfg portainer.TLSConfiguration) (*http.Transport, string, error) { //nolint:forbidigo
	baseTransport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
	}

	if !tlsCfg.TLS {
		return baseTransport, "http", nil
	}

	// If TLS is enabled but uses trusted system CA (no custom bundle) and verification isn't skipped,
	// we can use the default transport TLS settings.
	usesTrustedSystemCA := !tlsCfg.TLSSkipVerify && tlsCfg.TLSCACertPath == "" && tlsCfg.TLSCertPath == "" && tlsCfg.TLSKeyPath == ""
	if usesTrustedSystemCA {
		return baseTransport, "https", nil
	}

	// Otherwise, build a custom TLS config from disk (covers skip-verify and/or custom bundle)
	tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(tlsCfg)
	if err != nil {
		return nil, "", err
	}
	baseTransport.TLSClientConfig = tlsConfig

	return baseTransport, "https", nil
}
