package registries

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func Test_registryCreatePayload_Validate(t *testing.T) {
	basePayload := registryCreatePayload{Name: "Test registry", URL: "http://example.com"}
	t.Run("Can't create a ProGet registry if BaseURL is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.ProGetRegistry
		err := payload.Validate(nil)
		assert.Error(t, err)
	})
	t.Run("Can create a GitLab registry if BaseURL is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.GitlabRegistry
		err := payload.Validate(nil)
		assert.NoError(t, err)
	})
	t.Run("Can create a ProGet registry if BaseURL is not empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.ProGetRegistry
		payload.BaseURL = "http://example.com"
		err := payload.Validate(nil)
		assert.NoError(t, err)
	})
	t.Run("Can't create a AWS ECR registry if authentication required, but access key ID, secret access key or region is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.EcrRegistry
		payload.Authentication = true
		err := payload.Validate(nil)
		assert.Error(t, err)
	})
	t.Run("Do not require access key ID, secret access key, region for public AWS ECR registry", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.EcrRegistry
		payload.Authentication = false
		err := payload.Validate(nil)
		assert.NoError(t, err)
	})
}
