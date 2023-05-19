package images

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func TestFindBestMatchNeedAuthRegistry(t *testing.T) {
	is := assert.New(t)

	t.Run("", func(t *testing.T) {
		image := "USERNAME/nginx:latest"
		registries := []portainer.Registry{createNewRegistry("docker.io", "USERNAME", false),
			createNewRegistry("hub-mirror.c.163.com", "", false)}
		r, err := findBestMatchRegistry(image, registries)
		is.NoError(err, "")
		is.NotNil(r, "")
		is.False(r.Authentication, "")
		is.Equal("docker.io", r.URL)
	})

	t.Run("", func(t *testing.T) {
		image := "USERNAME/nginx:latest"
		registries := []portainer.Registry{createNewRegistry("docker.io", "", false),
			createNewRegistry("hub-mirror.c.163.com", "USERNAME", false)}
		r, err := findBestMatchRegistry(image, registries)
		is.NoError(err, "")
		is.NotNil(r, "")
		is.False(r.Authentication, "")
		is.Equal("docker.io", r.URL)
	})

	t.Run("", func(t *testing.T) {
		image := "docker.io/<USERNAME>/nginx:latest"
		registries := []portainer.Registry{createNewRegistry("docker.io", "USERNAME", true),
			createNewRegistry("hub-mirror.c.163.com", "", false)}
		r, err := findBestMatchRegistry(image, registries)
		is.NoError(err, "")
		is.NotNil(r, "")
		is.True(r.Authentication, "")
		is.Equal("docker.io", r.URL)
	})

	t.Run("", func(t *testing.T) {
		image := "portainer/portainer-ee:latest"
		registries := []portainer.Registry{createNewRegistry("docker.io", "", true)}
		r, err := findBestMatchRegistry(image, registries)
		is.NoError(err, "")
		is.NotNil(r, "")
		is.True(r.Authentication, "")
		is.Equal("docker.io", r.URL)
	})
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
