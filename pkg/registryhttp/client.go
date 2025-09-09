package registryhttp

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
	"oras.land/oras-go/v2/registry/remote/retry"
)

// CreateClient creates an HTTP client with appropriate TLS configuration based on registry type.
// All registries use retry clients for better resilience.
// Returns the HTTP client, whether to use plainHTTP, and any error.
func CreateClient(registry *portainer.Registry) (httpClient *http.Client, usePlainHttp bool, err error) {
	switch registry.Type {
	case portainer.AzureRegistry, portainer.EcrRegistry, portainer.GithubRegistry, portainer.GitlabRegistry, portainer.DockerHubRegistry:
		// Cloud registries use the default retry client with built-in TLS
		return retry.DefaultClient, false, nil
	default:
		// For all other registry types, use shared helper to build transport and scheme

		// if no management configuration, treat as plain HTTP for custom registries
		hasConfiguration := registry.ManagementConfiguration != nil
		if !hasConfiguration {
			return retry.DefaultClient, true, nil
		}

		tlsCfg := registry.ManagementConfiguration.TLSConfig

		// If TLS is disabled, use plain HTTP with default client
		if !tlsCfg.TLS {
			return retry.DefaultClient, true, nil
		}

		// If TLS is enabled and uses trusted system CA (no custom bundle, no skip-verify),
		// use the default retry client over HTTPS
		usesTrustedSystemCA := !tlsCfg.TLSSkipVerify && tlsCfg.TLSCACertPath == "" && tlsCfg.TLSCertPath == "" && tlsCfg.TLSKeyPath == ""
		if usesTrustedSystemCA {
			return retry.DefaultClient, false, nil
		}

		transport, scheme, err := BuildTransportAndSchemeFromTLSConfig(tlsCfg)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create TLS configuration")
			return nil, false, err
		}

		// If scheme is http, we can use the default client and instruct callers to use plainHTTP
		if scheme == "http" {
			return retry.DefaultClient, true, nil
		}

		// For https, wrap our transport with retry
		retryTransport := retry.NewTransport(transport)
		httpClient := &http.Client{
			Transport: retryTransport,
		}
		return httpClient, false, nil
	}
}
