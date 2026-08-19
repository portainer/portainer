package registries

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_registryCreatePayload_Validate(t *testing.T) {
	t.Parallel()
	basePayload := registryCreatePayload{Name: "Test registry", URL: "http://example.com"}
	t.Run("Can't create a ProGet registry if BaseURL is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.ProGetRegistry
		err := payload.Validate(nil)
		require.Error(t, err)
	})
	t.Run("Can create a GitLab registry if BaseURL is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.GitlabRegistry
		err := payload.Validate(nil)
		require.NoError(t, err)
	})
	t.Run("Can create a ProGet registry if BaseURL is not empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.ProGetRegistry
		payload.BaseURL = "http://example.com"
		err := payload.Validate(nil)
		require.NoError(t, err)
	})
	t.Run("Can't create a AWS ECR registry if authentication required, but access key ID, secret access key or region is empty", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.EcrRegistry
		payload.Authentication = true
		err := payload.Validate(nil)
		require.Error(t, err)
	})
	t.Run("Do not require access key ID, secret access key, region for public AWS ECR registry", func(t *testing.T) {
		payload := basePayload
		payload.Type = portainer.EcrRegistry
		payload.Authentication = false
		err := payload.Validate(nil)
		require.NoError(t, err)
	})
}

func TestHandler_registryCreate(t *testing.T) {
	t.Parallel()

	handler, _ := newTestHandler(t)

	payload := registryCreatePayload{
		Name:           "Test registry",
		Type:           portainer.ProGetRegistry,
		URL:            "http://example.com",
		BaseURL:        "http://example.com",
		Authentication: false,
		Username:       "username",
		Password:       "password",
		Gitlab:         portainer.GitlabRegistryData{},
	}
	payloadBytes, err := json.Marshal(payload)
	require.NoError(t, err)

	r := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(payloadBytes))
	w := httptest.NewRecorder()

	restrictedContext := &security.RestrictedRequestContext{IsAdmin: true, UserID: 1}

	ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
	r = r.WithContext(ctx)

	handlerError := handler.registryCreate(w, r)
	require.Nil(t, handlerError)

	registry := portainer.Registry{}
	err = json.NewDecoder(w.Body).Decode(&registry)
	require.NoError(t, err)

	assert.Equal(t, payload.Name, registry.Name)
	assert.Equal(t, payload.Type, registry.Type)
	assert.Equal(t, payload.URL, registry.URL)
	assert.Equal(t, payload.BaseURL, registry.BaseURL)
	assert.Equal(t, payload.Authentication, registry.Authentication)
	assert.Equal(t, payload.Username, registry.Username)
	assert.Empty(t, registry.Password)
}
