package apikey

import (
	"crypto/sha256"
	"encoding/base64"
	"log"
	"testing"
	"time"

	"github.com/gorilla/securecookie"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt"
	"github.com/stretchr/testify/assert"
)

func Test_SatisfiesAPIKeyServiceInterface(t *testing.T) {
	is := assert.New(t)
	is.Implements((*APIKeyService)(nil), NewAPIKeyService(nil, nil))
}

func Test_HashRaw(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully decodes base64 encoded string and generates hash digest", func(t *testing.T) {
		rawAPIKey := securecookie.GenerateRandomKey(32)
		encodedRawAPIKey := base64.StdEncoding.EncodeToString(rawAPIKey)
		digest, err := service.HashRaw(encodedRawAPIKey)
		is.NoError(err)
		is.NotEmpty(digest)
		is.Len(digest, 32)
	})
}

func Test_GenerateApiKey(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
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

	t.Run("Prefix matches encoded key prefix", func(t *testing.T) {
		rawKey, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-2")
		is.NoError(err)

		is.Equal(rawKey[:3], apiKey.Prefix)
		is.Len(apiKey.Prefix, 3)
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

		decodedKey, err := base64.StdEncoding.DecodeString(rawKey)
		is.NoError(err)

		generatedDigest := sha256.Sum256(decodedKey)

		is.Equal(apiKey.Digest, generatedDigest[:])
	})
}

func Test_GetAPIKeys(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
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

	store, teardown := bolt.MustNewTestStore(true)
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

	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully updates the api-key LastUsed time", func(t *testing.T) {
		user := portainer.User{ID: 1}
		store.User().CreateUser(&user)
		_, apiKey, err := service.GenerateApiKey(user, "test-x")
		is.NoError(err)

		apiKey.LastUsed = time.Now().UTC()
		err = service.UpdateAPIKey(apiKey)
		is.NoError(err)

		_, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		is.NoError(err)

		log.Println(apiKey)
		log.Println(apiKeyGot)

		is.Equal(apiKey.LastUsed, apiKeyGot.LastUsed)

	})

	t.Run("Successfully removes api-key from cache upon update", func(t *testing.T) {
		_, apiKey, err := service.GenerateApiKey(portainer.User{ID: 1}, "test-x2")
		is.NoError(err)

		_, apiKeyFromCache, ok := service.cache.Get(apiKey.Digest)
		is.True(ok)
		is.Equal(*apiKey, apiKeyFromCache)

		err = service.UpdateAPIKey(apiKey)
		is.NoError(err)

		_, _, ok = service.cache.Get(apiKey.Digest)
		is.False(ok)
	})
}

func Test_DeleteAPIKey(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	service := NewAPIKeyService(store.APIKeyRepository(), store.User())

	t.Run("Successfully updates the api-key", func(t *testing.T) {
		user := portainer.User{ID: 1}
		_, apiKey, err := service.GenerateApiKey(user, "test-1")
		is.NoError(err)

		_, apiKeyGot, err := service.GetDigestUserAndKey(apiKey.Digest)
		is.NoError(err)
		is.Equal(*apiKey, apiKeyGot)

		err = service.DeleteAPIKey(user.ID, apiKey.ID)
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

		err = service.DeleteAPIKey(user.ID, apiKey.ID)
		is.NoError(err)

		_, _, ok = service.cache.Get(apiKey.Digest)
		is.False(ok)
	})
}
