package cache

import (
	"fmt"
	"time"

	"github.com/patrickmn/go-cache"
	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/registry"
)

// Cache manages Helm registry clients with TTL-based expiration
// Registry clients are cached per registry ID rather than per user session
// to optimize rate limiting - one login per registry per Portainer instance
type Cache struct {
	cache *cache.Cache
}

// CachedRegistryClient wraps a registry client with metadata
type CachedRegistryClient struct {
	Client     *registry.Client
	RegistryID portainer.RegistryID
	CreatedAt  time.Time
}

// newCache creates a new Helm registry client cache with the specified timeout
func newCache(userSessionTimeout string) (*Cache, error) {
	timeout, err := time.ParseDuration(userSessionTimeout)
	if err != nil {
		return nil, fmt.Errorf("invalid user session timeout: %w", err)
	}

	return &Cache{
		cache: cache.New(timeout, timeout),
	}, nil
}

// getByRegistryID retrieves a cached registry client by registry ID
// Cache key strategy: use registryID for maximum efficiency against rate limits
// This means one login per registry per Portainer instance, regardless of user/environment
func (c *Cache) getByRegistryID(registryID portainer.RegistryID) (*registry.Client, bool) {
	key := generateRegistryIDCacheKey(registryID)

	cachedClient, found := c.cache.Get(key)
	if !found {
		log.Debug().
			Str("cache_key", key).
			Int("registry_id", int(registryID)).
			Str("context", "HelmRegistryCache").
			Msg("Cache miss for registry client")
		return nil, false
	}

	client := cachedClient.(CachedRegistryClient)

	log.Debug().
		Str("cache_key", key).
		Int("registry_id", int(registryID)).
		Str("context", "HelmRegistryCache").
		Msg("Cache hit for registry client")

	return client.Client, true
}

// setByRegistryID stores a registry client in the cache with registry ID context
func (c *Cache) setByRegistryID(registryID portainer.RegistryID, client *registry.Client) {
	if client == nil {
		log.Warn().
			Int("registry_id", int(registryID)).
			Str("context", "HelmRegistryCache").
			Msg("Attempted to cache nil registry client")
		return
	}

	key := generateRegistryIDCacheKey(registryID)

	cachedClient := CachedRegistryClient{
		Client:     client,
		RegistryID: registryID,
		CreatedAt:  time.Now(),
	}

	c.cache.Set(key, cachedClient, cache.DefaultExpiration)

	log.Debug().
		Str("cache_key", key).
		Int("registry_id", int(registryID)).
		Str("context", "HelmRegistryCache").
		Msg("Cached registry client")
}

// flushRegistry removes cached registry client for a specific registry ID
// This should be called whenever registry credentials change
func (c *Cache) flushRegistry(registryID portainer.RegistryID) {
	key := generateRegistryIDCacheKey(registryID)

	c.cache.Delete(key)
	log.Info().
		Int("registry_id", int(registryID)).
		Str("context", "HelmRegistryCache").
		Msg("Flushed registry client due to registry change")
}

// flushAll removes all cached registry clients
func (c *Cache) flushAll() {
	itemCount := c.cache.ItemCount()
	c.cache.Flush()

	if itemCount > 0 {
		log.Info().
			Int("cached_clients_removed", itemCount).
			Str("context", "HelmRegistryCache").
			Msg("Flushed all registry clients")
	}
}

// generateRegistryIDCacheKey creates a cache key from registry ID
// Key strategy decision: Use registry ID instead of user sessions or URL+username
// This provides optimal rate limiting protection since each registry only gets
// logged into once per Portainer instance, regardless of how many users access it
// RBAC security is enforced before reaching this caching layer
// When a new user needs access, they reuse the same cached client
func generateRegistryIDCacheKey(registryID portainer.RegistryID) string {
	return fmt.Sprintf("registry:%d", registryID)
}
