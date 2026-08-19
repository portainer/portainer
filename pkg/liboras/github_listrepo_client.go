package liboras

import (
	"context"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/github"
	"github.com/rs/zerolog/log"
)

// GithubListRepoClient implements RepositoryListClient specifically for GitHub registries
// This client handles the GitHub Packages API's unique repository listing implementation
type GithubListRepoClient struct {
	registry *portainer.Registry
	client   *github.Client
}

// NewGithubListRepoClient creates a new GitHub repository listing client
func NewGithubListRepoClient(registry *portainer.Registry) *GithubListRepoClient {
	// Prefer the management configuration credentials when available
	token := registry.Password
	if registry.ManagementConfiguration != nil && registry.ManagementConfiguration.Password != "" {
		token = registry.ManagementConfiguration.Password
	}

	client := github.NewClient(token)

	return &GithubListRepoClient{
		registry: registry,
		client:   client,
	}
}

// ListRepositories fetches repositories from a GitHub registry using the GitHub Packages API
func (c *GithubListRepoClient) ListRepositories(ctx context.Context) ([]string, error) {
	repositories, err := c.client.GetContainerPackages(
		ctx,
		c.registry.Github.UseOrganisation,
		c.registry.Github.OrganisationName,
	)
	if err != nil {
		log.Error().
			Str("registry_name", c.registry.Name).
			Err(err).
			Msg("Failed to list GitHub repositories")
		return nil, fmt.Errorf("failed to list GitHub repositories: %w", err)
	}

	log.Debug().
		Bool("use_organisation", c.registry.Github.UseOrganisation).
		Str("organisation_name", c.registry.Github.OrganisationName).
		Int("repository_count", len(repositories)).
		Msg("Successfully listed GitHub repositories")

	return repositories, nil
}
