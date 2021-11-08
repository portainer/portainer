package apikey

import (
	"time"

	cmap "github.com/orcaman/concurrent-map"
	portainer "github.com/portainer/portainer/api"
)

// entry is a tuple containing the user and API key associated to an API key digest
type entry struct {
	user   portainer.User
	apiKey portainer.APIKey
}

// apiKeyCache is a concurrency-safe, in-memory cache which primarily exists for to reduce database roundtrips.
// We store the api-key digest (keys) and the associated user and key-data (values) in the cache.
// This is required because HTTP requests will contain only the api-key digest in the x-api-key request header;
// digest value must be mapped to a portainer user (and respective key data) for validation.
// This cache is used to avoid multiple database queries to retrieve these user/key associated to the digest.
type apiKeyCache struct {
	cache               cmap.ConcurrentMap // map[string]entry
	keyEvictionDuration time.Duration      // duration after which an API key is automatically evicted from the cache
}

// NewAPIKeyCache creates a new cache for API keys
func NewAPIKeyCache(keyEvictionDuration time.Duration) *apiKeyCache {
	return &apiKeyCache{cache: cmap.New(), keyEvictionDuration: keyEvictionDuration}
}

// Get returns the user/key associated to an api-key's digest
// This is required because HTTP requests will contain the digest of the API key in header,
// the digest value must be mapped to a portainer user.
func (c *apiKeyCache) Get(digest []byte) (portainer.User, portainer.APIKey, bool) {
	val, ok := c.cache.Get(string(digest))
	if !ok {
		return portainer.User{}, portainer.APIKey{}, false
	}
	tuple := val.(entry)

	return tuple.user, tuple.apiKey, true
}

// Set persists a user/key entry to the cache
func (c *apiKeyCache) Set(digest []byte, user portainer.User, apiKey portainer.APIKey) {
	c.cache.Set(string(digest), entry{
		user:   user,
		apiKey: apiKey,
	})

	// automatically evict set key after keyEvictionDuration
	go func() {
		<-time.After(c.keyEvictionDuration)
		c.cache.Remove(string(digest))
	}()
}

// Delete evicts a digest's user/key entry key from the cache
func (c *apiKeyCache) Delete(digest []byte) {
	c.cache.Remove(string(digest))
}
