package apikey

import (
	"crypto/sha256"
	"log"
	"strings"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/assert"
)

func Test_SatisfiesAPIKeyServiceInterface(t *testing.T) {
	is := assert.New(t)
	is.Implements((*APIKeyService)(nil), NewAPIKeyService(nil, nil))
}

func Test_GenerateApiKey(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully generates API key", func(t *testing.T) {
		desc := "test-1"
		rawKey, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, desc)
		is.NoError(err)
		is.NotEmpty(rawKey)
		is.NotEmpty(apiKey)
		is.Equal(desc, apiKey.Description)
	})

	t.Run("Api key prefix is 7 chars", func(t *testing.T) {
		rawKey, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-2")
		is.NoError(err)

		is.Equal(rawKey[:7], apiKey.Prefix)
		is.Len(apiKey.Prefix, 7)
	})

	t.Run("Api key has 'ptr_' as prefix", func(t *testing.T) {
		rawKey, _, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-x")
		is.NoError(err)

		is.Equal(portainerAPIKeyPrefix, "ptr_")
		is.True(strings.HasPrefix(rawKey, "ptr_"))
	})

	t.Run("Successfully caches API key", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-3")
		is.NoError(err)

		userFromCache, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(user, userFromCache)
		is.Equal(apiKey, &apiKeyFromCache)
	})

	t.Run("Decoded raw api-key digest matches generated digest", func(t *testing.T) {
		rawKey, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-4")
		is.NoError(err)

		generatedDigest := sha256.Sum256([]byte(rawKey))

		is.Equal(apiKey.Digest, generatedDigest[:])
	})
}

func Test_GetAPIKey(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully returns all API keys", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		is.NoError(err)

		apiKeyGot, err := service.GetAPIKey(apiKey.ID)
		is.NoError(err)

		is.Equal(apiKey, apiKeyGot)
	})
}

func Test_GetAPIKeys(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully returns all API keys", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, _, err := service.GenerateApiKey(user, "test-1")
		is.NoError(err)
		_, _, err = service.GenerateApiKey(user, "test-2")
		is.NoError(err)

		keys, err := service.GetAPIKeys(user.ID)
		is.NoError(err)
		is.Len(keys, 2)
	})
}

func Test_GetDigestUserAndKey(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully returns user and api key associated to digest", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		is.NoError(err)

		userGot, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		is.NoError(err)
		is.Equal(user, userGot)
		is.Equal(*apiKey, apiKeyGot)
	})

	t.Run("Successfully caches user and api key associated to digest", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		is.NoError(err)

		userGot, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		is.NoError(err)
		is.Equal(user, userGot)
		is.Equal(*apiKey, apiKeyGot)

		userFromCache, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(userGot, userFromCache)
		is.Equal(apiKeyGot, apiKeyFromCache)
	})
}

func Test_UpdateAPIKey(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully updates the api-key LastUsed time", func(t *testing.T) {
		user := portainer.User{ID: 1}
		store.User().Create(&user)
		_, apiKey, err := service.GenerateApiKey(user, "test-x")
		is.NoError(err)

		apiKey.LastUsed = time.Now().UTC().Unix()
		err = service.UpdateAPIKey(apiKey)
		is.NoError(err)

		_, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		is.NoError(err)

		log.Println(apiKey)
		log.Println(apiKeyGot)

		is.Equal(apiKey.LastUsed, apiKeyGot.LastUsed)

	})

	t.Run("Successfully updates api-key in cache upon api-key update", func(t *testing.T) {
		_, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-x2")
		is.NoError(err)

		_, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(*apiKey, apiKeyFromCache)

		apiKey.LastUsed = time.Now().UTC().Unix()
		is.NotEqual(*apiKey, apiKeyFromCache)

		err = service.UpdateAPIKey(apiKey)
		is.NoError(err)

		_, updatedAPIKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(*apiKey, updatedAPIKeyFromCache)
	})
}

func Test_DeleteAPIKey(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully updates the api-key", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		is.NoError(err)

		_, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		is.NoError(err)
		is.Equal(*apiKey, apiKeyGot)

		err = service.DeleteAPIKey(apiKey.ID)
		is.NoError(err)

		_, _, err = service.GetDigestUserAndKey(apiKey.Digest)
		is.Error(err)
	})

	t.Run("Successfully removes api-key from cache upon deletion", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		is.NoError(err)

		_, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(*apiKey, apiKeyFromCache)

		err = service.DeleteAPIKey(apiKey.ID)
		is.NoError(err)

		_, _, ok = service.cache.Get(apiKey.Digest)
		is.False(ok)
	})
}

func Test_InvalidateUserKeyCache(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully updates evicts keys from cache", func(t *testing.T) {
		// generate api keys
		user := portainer.User{ID: 1}
		_, apiKey1, err := service.GenerateApiKey(user, "test-1")
		is.NoError(err)

		_, apiKey2, err := service.GenerateApiKey(user, "test-2")
		is.NoError(err)

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
		is.NoError(err)

		user2 := portainer.User{ID: 2}
		_, apiKey2, err := service.GenerateApiKey(user2, "test-2")
		is.NoError(err)

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
