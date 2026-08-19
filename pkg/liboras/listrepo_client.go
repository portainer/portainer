package liboras

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	"oras.land/oras-go/v2/registry/remote"
)

// RepositoryListClient provides an interface specifically for listing repositories
// This exists because listing repositories isn't a standard OCI operation, and we need to handle
// different registry types differently.
type RepositoryListClient interface {
	// ListRepositories returns a list of repository names from the registry
	ListRepositories(ctx context.Context) ([]string, error)
}

// RepositoryListClientFactory creates repository listing clients based on registry type
type RepositoryListClientFactory struct{}

// NewRepositoryListClientFactory creates a new factory instance
func NewRepositoryListClientFactory() RepositoryListClientFactory {
	return RepositoryListClientFactory{}
}

// CreateListClientWithRegistry creates a repository listing client based on the registry type
// and automatically configures it with the provided ORAS registry client for generic registries
func (f RepositoryListClientFactory) CreateListClientWithRegistry(registry *portainer.Registry, registryClient *remote.Registry) (RepositoryListClient, error) {
	switch registry.Type {
	case portainer.GitlabRegistry:
		return NewGitlabListRepoClient(registry), nil
	case portainer.GithubRegistry:
		return NewGithubListRepoClient(registry), nil
	default:
		genericClient := NewGenericListRepoClient(registry)
		genericClient.SetRegistryClient(registryClient)
		return genericClient, nil
	}
}
