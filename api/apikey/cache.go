package apikey

import (
	"sync"

	cmap "github.com/orcaman/concurrent-map"
	portainer "github.com/portainer/portainer/api"
)

type apiKeyCache struct {
	cache cmap.ConcurrentMap
	mux   sync.RWMutex
}

// NewAPIKeyCache creates a new cache for API keys
func NewAPIKeyCache() *apiKeyCache {
	return &apiKeyCache{
		cache: cmap.New(),
	}
}

// GetAPIKey returns the api-key associated to an api-key digest
// This is required because HTTP requests will contain the digest of the API key in header,
// the digest value must be mapped to an api-key to map to a portainer user.
func (c *apiKeyCache) GetAPIKey(digest string) (*portainer.APIKey, bool) {
	c.mux.RLock()
	defer c.mux.RUnlock()

	apiKey, ok := c.cache.Get(digest)
	if !ok {
		return nil, false
	}
	return apiKey.(*portainer.APIKey), true
}

// Set persists an API key to the cache
func (c *apiKeyCache) Set(apikey *portainer.APIKey) {
	c.mux.Lock()
	defer c.mux.Unlock()

	c.cache.Set(string(apikey.Digest[:]), apikey)
}

// Delete removes an API key from the cache
func (c *apiKeyCache) Delete(digest string) {
	c.mux.Lock()
	defer c.mux.Unlock()

	c.cache.Remove(digest)
}
