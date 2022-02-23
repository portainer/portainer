package registries

import (
	"bytes"
	"encoding/json"
	"github.com/portainer/portainer/api/database"
	registry2 "github.com/portainer/portainer/api/dataservices/registry"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/stretchr/testify/assert"
)

func ps(s string) *string {
	return &s
}

func pb(b bool) *bool {
	return &b
}

type TestBouncer struct{}

func (t TestBouncer) AdminAccess(h http.Handler) http.Handler {
	return h
}

func (t TestBouncer) RestrictedAccess(h http.Handler) http.Handler {
	return h
}

func (t TestBouncer) AuthenticatedAccess(h http.Handler) http.Handler {
	return h
}

// TODO, no i don't know what this is actually intended to test either.
func delete_TestHandler_registryUpdate(t *testing.T) {
	payload := registryUpdatePayload{
		Name:           ps("Updated test registry"),
		URL:            ps("http://example.org/feed"),
		BaseURL:        ps("http://example.org"),
		Authentication: pb(true),
		Username:       ps("username"),
		Password:       ps("password"),
	}
	payloadBytes, err := json.Marshal(payload)
	assert.NoError(t, err)
	registry := registry2.Registry{Type: portainer.ProGetRegistry, ID: 5}
	r := httptest.NewRequest(http.MethodPut, "/registries/5", bytes.NewReader(payloadBytes))
	w := httptest.NewRecorder()

	restrictedContext := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  database.UserID(1),
	}

	ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
	r = r.WithContext(ctx)

	updatedRegistry := registry2.Registry{}
	handler := newHandler(nil)
	handler.initRouter(TestBouncer{})
	handler.DataStore = testDataStore{
		registry: &testRegistryService{
			getRegistry: func(_ registry2.RegistryID) (*registry2.Registry, error) {
				return &registry, nil
			},
			updateRegistry: func(ID registry2.RegistryID, r *registry2.Registry) error {
				assert.Equal(t, ID, r.ID)
				updatedRegistry = *r
				return nil
			},
		},
	}

	handler.Router.ServeHTTP(w, r)
	assert.Equal(t, http.StatusOK, w.Code)
	// Registry type should remain intact
	assert.Equal(t, registry.Type, updatedRegistry.Type)

	assert.Equal(t, *payload.Name, updatedRegistry.Name)
	assert.Equal(t, *payload.URL, updatedRegistry.URL)
	assert.Equal(t, *payload.BaseURL, updatedRegistry.BaseURL)
	assert.Equal(t, *payload.Authentication, updatedRegistry.Authentication)
	assert.Equal(t, *payload.Username, updatedRegistry.Username)
	assert.Equal(t, *payload.Password, updatedRegistry.Password)

}
