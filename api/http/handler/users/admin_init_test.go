package users

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/http/security/setuptoken"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newAdminInitHandler(t *testing.T) *Handler {
	t.Helper()
	_, store := datastore.MustNewTestStore(t, true, false)
	rateLimiter := security.NewRateLimiter(10, 1*time.Second, 1*time.Hour)
	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	h := NewHandler(testhelpers.NewTestRequestBouncer(), rateLimiter, apiKeyService, mockPasswordStrengthChecker{})
	h.DataStore = store
	h.CryptoService = testhelpers.NewCryptoService()
	h.AdminCreationDone = make(chan struct{}, 1)
	return h
}

func Test_adminInit_setupTokenGate(t *testing.T) {
	t.Parallel()

	t.Run("403 without token header", func(t *testing.T) {
		handler := newAdminInitHandler(t)
		handler.SetupToken = "secret-token"
		body := strings.NewReader(`{"Username":"admin","Password":"abcdefgh12"}`)
		r := httptest.NewRequest(http.MethodPost, "/users/admin/init", body)
		err := handler.adminInit(httptest.NewRecorder(), r)
		require.NotNil(t, err)
		assert.Equal(t, http.StatusForbidden, err.StatusCode)
	})

	t.Run("403 with wrong token", func(t *testing.T) {
		handler := newAdminInitHandler(t)
		handler.SetupToken = "secret-token"
		body := strings.NewReader(`{"Username":"admin","Password":"abcdefgh12"}`)
		r := httptest.NewRequest(http.MethodPost, "/users/admin/init", body)
		r.Header.Set(setuptoken.HeaderName, "wrong")
		err := handler.adminInit(httptest.NewRecorder(), r)
		require.NotNil(t, err)
		assert.Equal(t, http.StatusForbidden, err.StatusCode)
	})

	t.Run("succeeds with correct token", func(t *testing.T) {
		handler := newAdminInitHandler(t)
		handler.SetupToken = "secret-token"
		body := strings.NewReader(`{"Username":"admin","Password":"abcdefgh12"}`)
		r := httptest.NewRequest(http.MethodPost, "/users/admin/init", body)
		r.Header.Set(setuptoken.HeaderName, "secret-token")
		err := handler.adminInit(httptest.NewRecorder(), r)
		assert.Nil(t, err)
	})
}
