package registryhttp

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
)

// BuildTransportAndSchemeFromTLSConfig returns an SSRF-protected HTTP transport and the
// scheme ("http" or "https") to use when contacting the registry. The transport is based on
// the TLS settings from tlsCfg; pass a zero-value TLSConfiguration for plaintext.
func BuildTransportAndSchemeFromTLSConfig(tlsCfg portainer.TLSConfiguration) (*http.Transport, string, error) {
	tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(tlsCfg)
	if err != nil {
		return nil, "", err
	}

	if tlsConfig == nil && fips.FIPSMode() {
		return nil, "", fips.ErrTLSRequired
	}

	transport := ssrf.NewTransport(tlsConfig)

	if tlsConfig == nil {
		return transport, "http", nil
	}

	return transport, "https", nil
}
