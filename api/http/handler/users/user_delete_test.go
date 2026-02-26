package users

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_deleteUserRemovesAccessTokens(t *testing.T) {
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create standard user
	user := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	err := store.User().Create(user)
	require.NoError(t, err, "error creating user")

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err, "Error initiating jwt service")
	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	requestBouncer := security.NewRequestBouncer(store, jwtService, apiKeyService)
	rateLimiter := security.NewRateLimiter(10, 1*time.Second, 1*time.Hour)
	passwordChecker := security.NewPasswordStrengthChecker(store.SettingsService)

	h := NewHandler(requestBouncer, rateLimiter, apiKeyService, passwordChecker)
	h.DataStore = store

	t.Run("standard user deletion removes all associated access tokens", func(t *testing.T) {
		_, _, err := apiKeyService.GenerateApiKey(*user, "test-user-token")
		require.NoError(t, err)

		keys, err := apiKeyService.GetAPIKeys(user.ID)
		require.NoError(t, err)
		is.Len(keys, 1)

		rr := httptest.NewRecorder()

		handleErr := h.deleteUser(rr, user)
		require.Nil(t, handleErr)

		is.Equal(http.StatusNoContent, rr.Code)

		keys, err = apiKeyService.GetAPIKeys(user.ID)
		require.NoError(t, err)
		is.Empty(keys)
	})
}
