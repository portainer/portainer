package apikey

import (
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"strings"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_SatisfiesAPIKeyServiceInterface(t *testing.T) {
	t.Parallel()
	is := assert.New(t)
	is.Implements((*APIKeyService)(nil), NewAPIKeyService(nil, nil))
}

func Test_GenerateApiKey(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully generates API key", func(t *testing.T) {
		desc := "test-1"
		rawKey, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, desc)
		require.NoError(t, err)
		is.NotEmpty(rawKey)
		is.NotEmpty(apiKey)
		is.Equal(desc, apiKey.Description)
	})

	t.Run("Api key prefix is 7 chars", func(t *testing.T) {
		rawKey, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-2")
		require.NoError(t, err)

		is.Equal(rawKey[:7], apiKey.Prefix)
		is.Len(apiKey.Prefix, 7)
	})

	t.Run("Api key has 'ptr_' as prefix", func(t *testing.T) {
		rawKey, _, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-x")
		require.NoError(t, err)

		is.Equal(portainerAPIKeyPrefix, "ptr_")
		is.True(strings.HasPrefix(rawKey, "ptr_"))
	})

	t.Run("Successfully caches API key", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-3")
		require.NoError(t, err)

		userFromCache, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(user, userFromCache)
		is.Equal(apiKey, &apiKeyFromCache)
	})

	t.Run("Decoded raw api-key digest matches generated digest", func(t *testing.T) {
		rawKey, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-4")
		require.NoError(t, err)

		generatedDigest := sha256.Sum256([]byte(rawKey))

		is.Equal(apiKey.Digest, base64.StdEncoding.EncodeToString(generatedDigest[:]))
	})
}

func Test_GetAPIKey(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully returns all API keys", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		require.NoError(t, err)

		apiKeyGot, err := service.GetAPIKey(apiKey.ID)
		require.NoError(t, err)

		is.Equal(apiKey, apiKeyGot)
	})
}

func Test_GetAPIKeys(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully returns all API keys", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, _, err := service.GenerateApiKey(user, "test-1")
		require.NoError(t, err)
		_, _, err = service.GenerateApiKey(user, "test-2")
		require.NoError(t, err)

		keys, err := service.GetAPIKeys(user.ID)
		require.NoError(t, err)
		is.Len(keys, 2)
	})
}

func Test_GetDigestUserAndKey(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully returns user and api key associated to digest", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		require.NoError(t, err)

		userGot, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		require.NoError(t, err)
		is.Equal(user, userGot)
		is.Equal(*apiKey, apiKeyGot)
	})

	t.Run("Successfully caches user and api key associated to digest", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		require.NoError(t, err)

		userGot, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		require.NoError(t, err)
		is.Equal(user, userGot)
		is.Equal(*apiKey, apiKeyGot)

		userFromCache, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(userGot, userFromCache)
		is.Equal(apiKeyGot, apiKeyFromCache)
	})
}

func Test_UpdateAPIKey(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully updates the api-key LastUsed time", func(t *testing.T) {
		user := portainer.User{ID: 1}

		err := store.User().Create(&user)
		require.NoError(t, err)

		_, apiKey, err := service.GenerateApiKey(user, "test-x")
		require.NoError(t, err)

		apiKey.LastUsed = time.Now().UTC().Unix()
		err = service.UpdateAPIKey(apiKey)
		require.NoError(t, err)

		_, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		require.NoError(t, err)

		log.Debug().Str("wanted", fmt.Sprintf("%+v", apiKey)).Str("got", fmt.Sprintf("%+v", apiKeyGot)).Msg("")

		is.Equal(apiKey.LastUsed, apiKeyGot.LastUsed)
	})

	t.Run("Successfully updates api-key in cache upon api-key update", func(t *testing.T) {
		_, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-x2")
		require.NoError(t, err)

		_, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(*apiKey, apiKeyFromCache)

		apiKey.LastUsed = time.Now().UTC().Unix()
		is.NotEqual(*apiKey, apiKeyFromCache)

		err = service.UpdateAPIKey(apiKey)
		require.NoError(t, err)

		_, updatedAPIKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(*apiKey, updatedAPIKeyFromCache)
	})
}

func Test_DeleteAPIKey(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully updates the api-key", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		require.NoError(t, err)

		_, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		require.NoError(t, err)
		is.Equal(*apiKey, apiKeyGot)

		err = service.DeleteAPIKey(apiKey.ID)
		require.NoError(t, err)

		_, _, err = service.GetDigestUserAndKey(apiKey.Digest)
		require.Error(t, err)
	})

	t.Run("Successfully removes api-key from cache upon deletion", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		require.NoError(t, err)

		_, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(*apiKey, apiKeyFromCache)

		err = service.DeleteAPIKey(apiKey.ID)
		require.NoError(t, err)

		_, _, ok = service.cache.Get(apiKey.Digest)
		is.False(ok)
	})
}

func Test_InvalidateUserKeyCache(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully updates evicts keys from cache", func(t *testing.T) {
		// generate api keys
		user := portainer.User{ID: 1}
		_, apiKey1, err := service.GenerateApiKey(user, "test-1")
		require.NoError(t, err)

		_, apiKey2, err := service.GenerateApiKey(user, "test-2")
		require.NoError(t, err)

		// verify api keys are present in cache
		_, apiKeyFromCache, ok := service.cache.Get(apiKey1.Digest)
		is.True(ok)
		is.Equal(*apiKey1, apiKeyFromCache)

		_, apiKeyFromCache, ok = service.cache.Get(apiKey2.Digest)
		is.True(ok)
		is.Equal(*apiKey2, apiKeyFromCache)

		// evict cache
		ok = service.InvalidateUserKeyCache(user.ID)
		is.True(ok)

		// verify users keys have been flushed from cache
		_, _, ok = service.cache.Get(apiKey1.Digest)
		is.False(ok)

		_, _, ok = service.cache.Get(apiKey2.Digest)
		is.False(ok)
	})

	t.Run("User key eviction does not affect other users keys", func(t *testing.T) {
		// generate keys for 2 users
		user1 := portainer.User{ID: 1}
		_, apiKey1, err := service.GenerateApiKey(user1, "test-1")
		require.NoError(t, err)

		user2 := portainer.User{ID: 2}
		_, apiKey2, err := service.GenerateApiKey(user2, "test-2")
		require.NoError(t, err)

		// verify keys in cache
		_, apiKeyFromCache, ok := service.cache.Get(apiKey1.Digest)
		is.True(ok)
		is.Equal(*apiKey1, apiKeyFromCache)

		_, apiKeyFromCache, ok = service.cache.Get(apiKey2.Digest)
		is.True(ok)
		is.Equal(*apiKey2, apiKeyFromCache)

		// evict key of single user from cache
		ok = service.cache.InvalidateUserKeyCache(user1.ID)
		is.True(ok)

		// verify user1 key has been flushed from cache
		_, _, ok = service.cache.Get(apiKey1.Digest)
		is.False(ok)

		// verify user2 key is still in cache
		_, _, ok = service.cache.Get(apiKey2.Digest)
		is.True(ok)
	})
}
