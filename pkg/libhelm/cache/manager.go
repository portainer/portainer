package cache

import (
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/registry"
)

var (
	// Global singleton instance
	instance *Cache
	once     sync.Once
)

// Initialize creates and initializes the global cache instance
func Initialize(userSessionTimeout string) error {
	var err error
	once.Do(func() {
		instance, err = newCache(userSessionTimeout)
		if err != nil {
			log.Error().
				Err(err).
				Str("user_session_timeout", userSessionTimeout).
				Msg("Failed to initialize Helm registry cache")
		} else {
			log.Info().
				Str("user_session_timeout", userSessionTimeout).
				Msg("Helm registry cache initialized")
		}
	})
	return err
}

// Registry-based cache management functions

// GetCachedRegistryClientByID retrieves a cached registry client by registry ID
func GetCachedRegistryClientByID(registryID portainer.RegistryID) (*registry.Client, bool) {
	if instance == nil {
		log.Debug().
			Str("context", "HelmRegistryCache").
			Msg("Cache not initialized, returning nil")
		return nil, false
	}
	return instance.getByRegistryID(registryID)
}

// SetCachedRegistryClientByID stores a registry client in the cache by registry ID
func SetCachedRegistryClientByID(registryID portainer.RegistryID, client *registry.Client) {
	if instance == nil {
		log.Warn().
			Str("context", "HelmRegistryCache").
			Msg("Cannot set cache entry - cache not initialized")
		return
	}
	instance.setByRegistryID(registryID, client)
}

// FlushRegistryByID removes cached registry client for a specific registry ID
// This should be called whenever registry credentials change
func FlushRegistryByID(registryID portainer.RegistryID) {
	if instance == nil {
		log.Debug().
			Str("context", "HelmRegistryCache").
			Msg("Cache not initialized, nothing to flush")
		return
	}
	instance.flushRegistry(registryID)
}

// FlushAll removes all cached registry clients
func FlushAll() {
	if instance == nil {
		log.Debug().
			Str("context", "HelmRegistryCache").
			Msg("Cache not initialized, nothing to flush")
		return
	}
	instance.flushAll()
}
