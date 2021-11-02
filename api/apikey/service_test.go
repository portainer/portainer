package apikey

import (
	"encoding/base64"
	"testing"

	"github.com/portainer/portainer/api/bolt"
	"github.com/stretchr/testify/assert"
)

func Test_SatisfiesAPIKeyServiceInterface(t *testing.T) {
	is := assert.New(t)
	is.Implements((*APIKeyService)(nil), NewAPIKeyService(nil))
}

func Test_GenerateApiKey(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository())

	t.Run("Successfully generates API key", func(t *testing.T) {
		desc := "test-1"
		rawKey, apiKey, err := service.GenerateApiKey(1, desc)
		is.NoError(err)
		is.NotEmpty(rawKey)
		is.NotEmpty(apiKey)
		is.Equal(desc, apiKey.Description)
	})

	t.Run("Prefix matches encoded key prefix", func(t *testing.T) {
		rawKey, apiKey, err := service.GenerateApiKey(1, "test-2")
		is.NoError(err)

		encodedKey := base64.StdEncoding.EncodeToString(rawKey)
		is.Equal(encodedKey[:3], string(apiKey.Prefix[:]))
	})

	t.Run("Successfully caches API key", func(t *testing.T) {
		_, apiKey, err := service.GenerateApiKey(1, "test-3")
		is.NoError(err)

		apiKeyFromCache, ok := service.cache.GetAPIKey(string(apiKey.Digest[:]))
		is.True(ok)
		is.Equal(apiKey, apiKeyFromCache)
	})
}

func Test_GetAPIKeys(t *testing.T) {
	// TODO: implement
}

func Test_GetAPIKey(t *testing.T) {
	// TODO: implement
}

func Test_DeleteAPIKey(t *testing.T) {
	// TODO: implement
}
