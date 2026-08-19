package liboras

import (
	"context"
	"errors"

	portainer "github.com/portainer/portainer/api"
	"oras.land/oras-go/v2/registry/remote"
)

// GenericListRepoClient implements RepositoryListClient for standard OCI registries
// This client handles repository listing for registries that follow the standard OCI distribution spec
type GenericListRepoClient struct {
	registry       *portainer.Registry
	registryClient *remote.Registry
}

// NewGenericListRepoClient creates a new generic repository listing client
func NewGenericListRepoClient(registry *portainer.Registry) *GenericListRepoClient {
	return &GenericListRepoClient{
		registry: registry,
		// registryClient will be set when needed
	}
}

// SetRegistryClient sets the ORAS registry client for repository listing operations
func (c *GenericListRepoClient) SetRegistryClient(registryClient *remote.Registry) {
	c.registryClient = registryClient
}

// ListRepositories fetches repositories from a standard OCI registry using ORAS
func (c *GenericListRepoClient) ListRepositories(ctx context.Context) ([]string, error) {
	if c.registryClient == nil {
		return nil, errors.New("registry client not initialized for repository listing")
	}

	var repositories []string
	err := c.registryClient.Repositories(ctx, "", func(repos []string) error {
		repositories = append(repositories, repos...)
		return nil
	})
	if err != nil {
		return nil, errors.New("failed to list repositories")
	}

	return repositories, nil
}
