package liboras

import (
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/registryhttp"

	"github.com/rs/zerolog/log"
	"oras.land/oras-go/v2/registry/remote"
	"oras.land/oras-go/v2/registry/remote/auth"
)

// CreateClient creates a new ORAS registry client based on the provided portainer.Registry.
// It configures the client for authentication if the registry requires it.
// Furthermore, the client is configured to use the default retry client. Its policy is found in retry.DefaultPolicy
func CreateClient(registry portainer.Registry) (*remote.Registry, error) {
	registryClient, err := remote.NewRegistry(registry.URL)
	if err != nil {
		log.Error().Err(err).Str("registryUrl", registry.URL).Msg("Failed to create registry client")
		return nil, err
	}

	// Configure HTTP client based on registry type using the shared utility
	httpClient, usePlainHTTP, err := registryhttp.CreateClient(&registry)
	if err != nil {
		return nil, err
	}

	registryClient.PlainHTTP = usePlainHTTP

	// By default, oras sends multiple requests to get the full list of repos/tags/referrers.
	// set a high page size limit for fewer round trips.
	// e.g. https://github.com/oras-project/oras-go/blob/v2.6.0/registry/remote/registry.go#L129-L142
	registryClient.RepositoryListPageSize = 1000
	registryClient.TagListPageSize = 1000
	registryClient.ReferrerListPageSize = 1000

	authClient := &auth.Client{
		Client: httpClient,
	}

	configureCredentials := registry.Authentication &&
		strings.TrimSpace(registry.Username) != "" &&
		strings.TrimSpace(registry.Password) != ""
	if !configureCredentials {
		// The authClient is still needed to handle anonymous access and token refresh. For instance to send requests to
		// DockerHub which requires a token even for anonymous access.
		registryClient.Client = authClient
		log.Debug().
			Str("registryURL", registry.URL).
			Str("registryType", getRegistryTypeName(registry.Type)).
			Bool("authentication", false).
			Msg("Created ORAS registry client for anonymous access")

		return registryClient, nil
	}

	authClient.Cache = auth.NewCache()
	authClient.Credential = auth.StaticCredential(registry.URL, auth.Credential{
		Username: registry.Username,
		Password: registry.Password,
	})
	registryClient.Client = authClient

	log.Debug().
		Str("registryURL", registry.URL).
		Str("registryType", getRegistryTypeName(registry.Type)).
		Bool("authentication", true).
		Msg("Created ORAS registry client with authentication")

	return registryClient, nil
}

// getRegistryTypeName returns a human-readable name for the registry type
func getRegistryTypeName(registryType portainer.RegistryType) string {
	switch registryType {
	case portainer.QuayRegistry:
		return "Quay"
	case portainer.AzureRegistry:
		return "Azure"
	case portainer.CustomRegistry:
		return "Custom"
	case portainer.GitlabRegistry:
		return "GitLab"
	case portainer.ProGetRegistry:
		return "ProGet"
	case portainer.DockerHubRegistry:
		return "DockerHub"
	case portainer.EcrRegistry:
		return "ECR"
	default:
		return "Unknown"
	}
}
