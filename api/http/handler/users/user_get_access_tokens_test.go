package users

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_userGetAccessTokens(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create admin and standard user(s)
	adminUser := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	err := store.User().Create(adminUser)
	require.NoError(t, err, "error creating admin user")

	user := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	err = store.User().Create(user)
	require.NoError(t, err, "error creating user")

	h, jwtService, apiKeyService := newTestHandler(t, store)

	// generate standard and admin user tokens
	adminJWT, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: adminUser.ID, Username: adminUser.Username, Role: adminUser.Role})
	jwt, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: user.ID, Username: user.Username, Role: user.Role})

	t.Run("standard user can successfully retrieve API key", func(t *testing.T) {
		_, apiKey, err := apiKeyService.GenerateApiKey(*user, "test-get-token")
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/users/2/tokens", nil)
		testhelpers.AddTestSecurityCookie(req, jwt)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		require.NoError(t, err, "ReadAll should not return error")

		var resp []portainer.APIKey
		err = json.Unmarshal(body, &resp)
		require.NoError(t, err, "response should be list json")

		is.Len(resp, 1)
		if len(resp) == 1 {
			is.Empty(resp[0].Digest)
			is.Equal(apiKey.ID, resp[0].ID)
			is.Equal(apiKey.UserID, resp[0].UserID)
			is.Equal(apiKey.Prefix, resp[0].Prefix)
			is.Equal(apiKey.Description, resp[0].Description)
		}
	})

	t.Run("admin can retrieve standard user API Key", func(t *testing.T) {
		_, _, err := apiKeyService.GenerateApiKey(*user, "test-get-admin-token")
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/users/2/tokens", nil)
		testhelpers.AddTestSecurityCookie(req, adminJWT)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		require.NoError(t, err, "ReadAll should not return error")

		var resp []portainer.APIKey
		err = json.Unmarshal(body, &resp)
		require.NoError(t, err, "response should be list json")

		is.NotEmpty(resp)
	})

	t.Run("user can retrieve API Key using api-key auth", func(t *testing.T) {
		rawAPIKey, _, err := apiKeyService.GenerateApiKey(*user, "test-api-key")
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/users/2/tokens", nil)
		req.Header.Add("x-api-key", rawAPIKey)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		require.NoError(t, err, "ReadAll should not return error")

		var resp []portainer.APIKey
		err = json.Unmarshal(body, &resp)
		require.NoError(t, err, "response should be list json")

		is.NotEmpty(resp)
	})
}

func Test_hideAPIKeyFields(t *testing.T) {
	t.Parallel()
	apiKey := &portainer.APIKey{
		ID:          1,
		UserID:      2,
		Prefix:      "abc",
		Description: "test",
		Digest:      "",
	}

	hideAPIKeyFields(apiKey)

	require.Empty(t, apiKey.Digest, "digest should be cleared when hiding api key fields")
}
