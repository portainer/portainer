package users

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_updateUserRemovesAccessTokens(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// Create standard user
	user := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	err := store.User().Create(user)
	require.NoError(t, err, "error creating user")

	h, _, apiKeyService := newTestHandler(t, store)

	t.Run("standard user deletion removes all associated access tokens", func(t *testing.T) {
		_, _, err := apiKeyService.GenerateApiKey(*user, "test-user-token")
		require.NoError(t, err)

		keys, err := apiKeyService.GetAPIKeys(user.ID)
		require.NoError(t, err)
		is.Len(keys, 1)

		rr := httptest.NewRecorder()

		handlerErr := h.deleteUser(rr, user)
		require.Nil(t, handlerErr)

		is.Equal(http.StatusNoContent, rr.Code)

		keys, err = apiKeyService.GetAPIKeys(user.ID)
		require.NoError(t, err)
		is.Empty(keys)
	})
}
