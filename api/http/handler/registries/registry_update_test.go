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

func TestHandler_registryUpdate(t *testing.T) {
	t.Parallel()

	handler, store := newTestHandler(t)

	registry := &portainer.Registry{Type: portainer.ProGetRegistry}

	err := store.Registry().Create(registry)
	require.NoError(t, err)

	payload := registryUpdatePayload{
		Name:           new("Updated test registry"),
		URL:            new("http://example.org/feed"),
		BaseURL:        new("http://example.org"),
		Authentication: new(true),
		Username:       new("username"),
		Password:       new("password"),
	}

	payloadBytes, err := json.Marshal(payload)
	require.NoError(t, err)

	r := httptest.NewRequest(http.MethodPut, "/registries/1", bytes.NewReader(payloadBytes))
	w := httptest.NewRecorder()

	restrictedContext := &security.RestrictedRequestContext{IsAdmin: true, UserID: 1}

	ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
	r = r.WithContext(ctx)

	handler.ServeHTTP(w, r)
	require.Equal(t, http.StatusOK, w.Code)

	updatedRegistry := portainer.Registry{}
	err = json.NewDecoder(w.Body).Decode(&updatedRegistry)
	require.NoError(t, err)

	// Registry type should remain intact
	assert.Equal(t, registry.Type, updatedRegistry.Type)

	assert.Equal(t, *payload.Name, updatedRegistry.Name)
	assert.Equal(t, *payload.URL, updatedRegistry.URL)
	assert.Equal(t, *payload.BaseURL, updatedRegistry.BaseURL)
	assert.Equal(t, *payload.Authentication, updatedRegistry.Authentication)
	assert.Equal(t, *payload.Username, updatedRegistry.Username)
	assert.Empty(t, updatedRegistry.Password)
}
