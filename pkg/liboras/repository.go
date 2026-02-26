package liboras

import (
	"context"
	"fmt"
	"io"
	"sort"

	ocispec "github.com/opencontainers/image-spec/specs-go/v1"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/concurrent"
	"github.com/portainer/portainer/api/logs"
	"github.com/segmentio/encoding/json"
	"golang.org/x/mod/semver"
	"oras.land/oras-go/v2/registry"
	"oras.land/oras-go/v2/registry/remote"
)

// ListRepositories retrieves all repositories from a registry using specialized repository listing clients
// Each registry type has different repository listing implementations that require specific API calls
func ListRepositories(ctx context.Context, registry *portainer.Registry, registryClient *remote.Registry) ([]string, error) {
	factory := NewRepositoryListClientFactory()
	listClient, err := factory.CreateListClientWithRegistry(registry, registryClient)
	if err != nil {
		return nil, fmt.Errorf("failed to create repository list client: %w", err)
	}

	return listClient.ListRepositories(ctx)
}

// FilterRepositoriesByMediaType filters repositories to only include those with the expected media type
func FilterRepositoriesByMediaType(ctx context.Context, repositoryNames []string, registryClient *remote.Registry, expectedMediaType string) ([]string, error) {
	// Run concurrently as this can take 10s+ to complete in serial
	var tasks []concurrent.Func
	for _, repoName := range repositoryNames {
		name := repoName
		task := func(ctx context.Context) (any, error) {
			repository, err := registryClient.Repository(ctx, name)
			if err != nil {
				return nil, err
			}

			if HasMediaType(ctx, repository, expectedMediaType) {
				return name, nil
			}
			return nil, nil // not a repository with the expected media type
		}
		tasks = append(tasks, task)
	}

	// 10 is a reasonable max concurrency limit
	results, err := concurrent.Run(ctx, 10, tasks...)
	if err != nil {
		return nil, err
	}

	// Collect repository names
	var repositories []string
	for _, result := range results {
		if result.Result != nil {
			if repoName, ok := result.Result.(string); ok {
				repositories = append(repositories, repoName)
			}
		}
	}

	return repositories, nil
}

// HasMediaType checks if a repository has artifacts with the specified media type
func HasMediaType(ctx context.Context, repository registry.Repository, expectedMediaType string) bool {
	// Check the first available tag
	// Reasonable limitation - it won't work for repos where the latest tag is missing the expected media type but other tags have it
	// This tradeoff is worth it for the performance benefits
	var latestTag string
	err := repository.Tags(ctx, "", func(tagList []string) error {
		if len(tagList) > 0 {
			// Order the taglist by latest semver, then get the latest tag
			// e.g. ["1.0", "1.1"] -> ["1.1", "1.0"] -> "1.1"
			sort.Slice(tagList, func(i, j int) bool {
				return semver.Compare(tagList[i], tagList[j]) > 0
			})
			latestTag = tagList[0]
		}
		return nil
	})

	if err != nil {
		return false
	}

	if latestTag == "" {
		return false
	}

	descriptor, err := repository.Resolve(ctx, latestTag)
	if err != nil {
		return false
	}

	return descriptorHasMediaType(ctx, repository, descriptor, expectedMediaType)
}

// descriptorHasMediaType checks if a descriptor or its manifest contains the expected media type
func descriptorHasMediaType(ctx context.Context, repository registry.Repository, descriptor ocispec.Descriptor, expectedMediaType string) bool {
	// Check if the descriptor indicates the expected media type
	if descriptor.MediaType == expectedMediaType {
		return true
	}

	// Otherwise, look for the expected media type in the entire manifest content
	manifestReader, err := repository.Manifests().Fetch(ctx, descriptor)
	if err != nil {
		return false
	}
	defer logs.CloseAndLogErr(manifestReader)

	content, err := io.ReadAll(manifestReader)
	if err != nil {
		return false
	}
	var manifest ocispec.Manifest
	if err := json.Unmarshal(content, &manifest); err != nil {
		return false
	}

	return manifest.Config.MediaType == expectedMediaType
}
