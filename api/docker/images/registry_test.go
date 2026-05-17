package images

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFindBestMatchNeedAuthRegistry(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	t.Run("", func(t *testing.T) {
		image := "USERNAME/nginx:latest"
		registries := []portainer.Registry{createNewRegistry("docker.io", "USERNAME", false),
			createNewRegistry("hub-mirror.c.163.com", "", false)}
		r, err := findBestMatchRegistry(image, registries)
		require.NoError(t, err)
		is.NotNil(r)
		is.False(r.Authentication)
		is.Equal("docker.io", r.URL)
	})

	t.Run("", func(t *testing.T) {
		image := "USERNAME/nginx:latest"
		registries := []portainer.Registry{createNewRegistry("docker.io", "", false),
			createNewRegistry("hub-mirror.c.163.com", "USERNAME", false)}
		r, err := findBestMatchRegistry(image, registries)
		require.NoError(t, err)
		is.NotNil(r)
		is.False(r.Authentication)
		is.Equal("docker.io", r.URL)
	})

	t.Run("", func(t *testing.T) {
		image := "docker.io/<USERNAME>/nginx:latest"
		registries := []portainer.Registry{createNewRegistry("docker.io", "USERNAME", true),
			createNewRegistry("hub-mirror.c.163.com", "", false)}
		r, err := findBestMatchRegistry(image, registries)
		require.NoError(t, err)
		is.NotNil(r)
		is.True(r.Authentication)
		is.Equal("docker.io", r.URL)
	})

	t.Run("", func(t *testing.T) {
		image := "portainer/portainer-ee:latest"
		registries := []portainer.Registry{createNewRegistry("docker.io", "", true)}
		r, err := findBestMatchRegistry(image, registries)
		require.NoError(t, err)
		is.NotNil(r)
		is.True(r.Authentication)
		is.Equal("docker.io", r.URL)
	})
}

func TestFindBestMatchRegistryCachesMatch(t *testing.T) {
	registriesCache.Flush()
	t.Cleanup(registriesCache.Flush)

	image := "private.registry.example.com/library/nginx:latest"
	registries := []portainer.Registry{
		createNewRegistry("private.registry.example.com", "", true),
	}

	registry, err := findBestMatchRegistry(image, registries)
	require.NoError(t, err)
	require.Equal(t, "private.registry.example.com", registry.URL)

	cached, err := cachedRegistry(image)
	require.NoError(t, err)
	require.Equal(t, registry, cached)
}

func createNewRegistry(domain, username string, auth bool) portainer.Registry {
	registry := portainer.Registry{
		URL:            domain,
		Authentication: auth,
		Username:       username,
	}

	if domain == "docker.io" {
		registry.Type = portainer.DockerHubRegistry
	}

	return registry
}
