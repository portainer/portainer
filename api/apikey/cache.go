package apikey

import (
	portainer "github.com/portainer/portainer/api"

	lru "github.com/hashicorp/golang-lru"
)

const DefaultAPIKeyCacheSize = 1024

// entry is a tuple containing the user and API key associated to an API key digest
type entry[T any] struct {
	user   T
	apiKey portainer.APIKey
}

type UserCompareFn[T any] func(T, portainer.UserID) bool

// ApiKeyCache is a concurrency-safe, in-memory cache which primarily exists for to reduce database roundtrips.
// We store the api-key digest (keys) and the associated user and key-data (values) in the cache.
// This is required because HTTP requests will contain only the api-key digest in the x-api-key request header;
// digest value must be mapped to a portainer user (and respective key data) for validation.
// This cache is used to avoid multiple database queries to retrieve these user/key associated to the digest.
type ApiKeyCache[T any] struct {
	// cache type [string]entry cache (key: string(digest), value: user/key entry)
	// note: []byte keys are not supported by golang-lru Cache
	cache     *lru.Cache
	userCmpFn UserCompareFn[T]
}

// NewAPIKeyCache creates a new cache for API keys
func NewAPIKeyCache[T any](cacheSize int, userCompareFn UserCompareFn[T]) *ApiKeyCache[T] {
	cache, _ := lru.New(cacheSize)

	return &ApiKeyCache[T]{cache: cache, userCmpFn: userCompareFn}
}

// Get returns the user/key associated to an api-key's digest
// This is required because HTTP requests will contain the digest of the API key in header,
// the digest value must be mapped to a portainer user.
func (c *ApiKeyCache[T]) Get(digest string) (T, portainer.APIKey, bool) {
	val, ok := c.cache.Get(digest)
	if !ok {
		var t T

		return t, portainer.APIKey{}, false
	}

	tuple := val.(entry[T])

	return tuple.user, tuple.apiKey, true
}

// Set persists a user/key entry to the cache
func (c *ApiKeyCache[T]) Set(digest string, user T, apiKey portainer.APIKey) {
	c.cache.Add(digest, entry[T]{
		user:   user,
		apiKey: apiKey,
	})
}

// Delete evicts a digest's user/key entry key from the cache
func (c *ApiKeyCache[T]) Delete(digest string) {
	c.cache.Remove(digest)
}

// InvalidateUserKeyCache loops through all the api-keys associated to a user and removes them from the cache
func (c *ApiKeyCache[T]) InvalidateUserKeyCache(userId portainer.UserID) bool {
	present := false

	for _, k := range c.cache.Keys() {
		user, _, _ := c.Get(k.(string))
		if c.userCmpFn(user, userId) {
			present = c.cache.Remove(k)
		}
	}

	return present
}
