package liboras

import (
	"context"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy/factory/gitlab"
	"github.com/rs/zerolog/log"
)

// GitlabListRepoClient implements RepositoryListClient specifically for GitLab registries
// This client handles the GitLab Container Registry API's unique repository listing implementation
type GitlabListRepoClient struct {
	registry *portainer.Registry
	client   *gitlab.Client
}

// NewGitlabListRepoClient creates a new GitLab repository listing client
func NewGitlabListRepoClient(registry *portainer.Registry) *GitlabListRepoClient {
	client := gitlab.NewClient(registry.Gitlab.InstanceURL, registry.Password)

	return &GitlabListRepoClient{
		registry: registry,
		client:   client,
	}
}

// ListRepositories fetches repositories from a GitLab registry using the GitLab API
func (c *GitlabListRepoClient) ListRepositories(ctx context.Context) ([]string, error) {
	repositories, err := c.client.GetRegistryRepositoryNames(ctx, c.registry.Gitlab.ProjectID)
	if err != nil {
		log.Error().
			Str("registry_name", c.registry.Name).
			Err(err).
			Msg("Failed to list GitLab repositories")
		return nil, fmt.Errorf("failed to list GitLab repositories: %w", err)
	}

	log.Debug().
		Str("gitlab_url", c.registry.Gitlab.InstanceURL).
		Int("project_id", c.registry.Gitlab.ProjectID).
		Int("repository_count", len(repositories)).
		Msg("Successfully listed GitLab repositories")

	return repositories, nil
}
