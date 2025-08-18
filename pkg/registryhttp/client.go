package registryhttp

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/rs/zerolog/log"
	"oras.land/oras-go/v2/registry/remote/retry"
)

// CreateClient creates an HTTP client with appropriate TLS configuration based on registry type.
// All registries use retry clients for better resilience.
// Returns the HTTP client, whether to use plainHTTP, and any error.
func CreateClient(registry *portainer.Registry) (*http.Client, bool, error) {
	switch registry.Type {
	case portainer.AzureRegistry, portainer.EcrRegistry, portainer.GithubRegistry, portainer.GitlabRegistry:
		// Cloud registries use the default retry client with built-in TLS
		return retry.DefaultClient, false, nil
	default:
		// For all other registry types, check if custom TLS is needed
		if registry.ManagementConfiguration != nil && registry.ManagementConfiguration.TLSConfig.TLS {
			// Need custom TLS configuration - create a retry client with custom transport
			baseTransport := &http.Transport{
				Proxy: http.ProxyFromEnvironment,
			}

			tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(
				registry.ManagementConfiguration.TLSConfig,
			)
			if err != nil {
				log.Error().Err(err).Msg("Failed to create TLS configuration")
				return nil, false, err
			}
			baseTransport.TLSClientConfig = tlsConfig

			// Create a retry transport wrapping our custom base transport
			retryTransport := retry.NewTransport(baseTransport)
			httpClient := &http.Client{
				Transport: retryTransport,
			}
			return httpClient, false, nil
		}

		// Default to HTTP for non-cloud registries without TLS configuration
		return retry.DefaultClient, true, nil
	}
}
