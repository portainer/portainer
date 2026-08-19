package registries

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_RegistryAccess_RequiresAuthentication(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)
	registry := &portainer.Registry{
		ID:   1,
		Name: "test-registry",
		URL:  "https://registry.test.com",
	}

	err := store.Registry().Create(registry)
	require.NoError(t, err)

	handler := &Handler{DataStore: store}
	req := httptest.NewRequest(http.MethodGet, "/registries/1", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})
	bouncer := handler.RegistryAccess(testHandler)
	bouncer.ServeHTTP(rr, req)
	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func Test_RegistryAccess_InvalidRegistryID(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)
	user := &portainer.User{ID: 1, Username: "test", Role: portainer.StandardUserRole}
	err := store.User().Create(user)
	require.NoError(t, err)

	handler := &Handler{DataStore: store}
	req := httptest.NewRequest(http.MethodGet, "/registries/invalid", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "invalid"})
	tokenData := &portainer.TokenData{ID: 1, Role: portainer.StandardUserRole}
	req = req.WithContext(security.StoreTokenData(req, tokenData))
	rr := httptest.NewRecorder()

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

	bouncer := handler.RegistryAccess(testHandler)
	bouncer.ServeHTTP(rr, req)
	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func Test_RegistryAccess_RegistryNotFound(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	user := &portainer.User{ID: 1, Username: "test", Role: portainer.StandardUserRole}
	err := store.User().Create(user)
	require.NoError(t, err)

	handler := &Handler{
		DataStore:      store,
		requestBouncer: testhelpers.NewTestRequestBouncer(),
	}

	req := httptest.NewRequest(http.MethodGet, "/registries/999", nil)
	req = mux.SetURLVars(req, map[string]string{"id": "999"})
	tokenData := &portainer.TokenData{ID: 1, Role: portainer.StandardUserRole}
	req = req.WithContext(security.StoreTokenData(req, tokenData))

	rr := httptest.NewRecorder()

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

	bouncer := handler.RegistryAccess(testHandler)
	bouncer.ServeHTTP(rr, req)
	assert.Equal(t, http.StatusNotFound, rr.Code)
}
