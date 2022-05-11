package registries

import (
	"bytes"
	"encoding/json"
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

func (t TestBouncer) AuthenticatedAccess(h http.Handler) http.Handler {
	return h
}

func (t TestBouncer) AuthorizedEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error {
	return nil
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
	registry := portainer.Registry{Type: portainer.ProGetRegistry, ID: 5}
	r := httptest.NewRequest(http.MethodPut, "/registries/5", bytes.NewReader(payloadBytes))
	w := httptest.NewRecorder()

	restrictedContext := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  portainer.UserID(1),
	}

	ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
	r = r.WithContext(ctx)

	updatedRegistry := portainer.Registry{}
	handler := newHandler(nil)
	handler.initRouter(TestBouncer{})
	handler.DataStore = testDataStore{
		registry: &testRegistryService{
			getRegistry: func(_ portainer.RegistryID) (*portainer.Registry, error) {
				return &registry, nil
			},
			updateRegistry: func(ID portainer.RegistryID, r *portainer.Registry) error {
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
