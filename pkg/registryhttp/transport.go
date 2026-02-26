package registryhttp

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/pkg/fips"
)

// BuildTransportAndSchemeFromTLSConfig returns a base HTTP transport configured
// with ProxyFromEnvironment and, when needed, a TLSClientConfig derived from the
// provided TLS settings. It also returns the scheme ("http" or "https") that
// should be used to contact the registry based on the TLS settings.
func BuildTransportAndSchemeFromTLSConfig(tlsCfg portainer.TLSConfiguration) (*http.Transport, string, error) {
	baseTransport := http.DefaultTransport.(*http.Transport).Clone()
	baseTransport.Proxy = http.ProxyFromEnvironment

	tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(tlsCfg)
	if err != nil {
		return nil, "", err
	}

	baseTransport.TLSClientConfig = tlsConfig

	if tlsConfig == nil && fips.FIPSMode() {
		return nil, "", fips.ErrTLSRequired
	} else if tlsConfig == nil {
		return baseTransport, "http", nil
	}

	return baseTransport, "https", nil
}
