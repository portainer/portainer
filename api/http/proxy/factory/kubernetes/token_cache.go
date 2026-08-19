package kubernetes

import (
	"sync"

	portainer "github.com/portainer/portainer/api"
)

// TokenCacheManager represents a service used to manage multiple tokenCache objects.
type TokenCacheManager struct {
	tokenCaches map[portainer.EndpointID]*tokenCache
	mu          sync.Mutex
}

type tokenCache struct {
	userTokenCache map[portainer.UserID]string
	mu             sync.Mutex
}

// NewTokenCacheManager returns a pointer to a new instance of TokenCacheManager
func NewTokenCacheManager() *TokenCacheManager {
	return &TokenCacheManager{
		tokenCaches: make(map[portainer.EndpointID]*tokenCache),
	}
}

// GetOrCreateTokenCache will get the tokenCache from the manager map of caches if it exists,
// otherwise it will create a new tokenCache object, associate it to the manager map of caches
// and return a pointer to that tokenCache instance.
func (manager *TokenCacheManager) GetOrCreateTokenCache(endpointID portainer.EndpointID) *tokenCache {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	if tc, ok := manager.tokenCaches[endpointID]; ok {
		return tc
	}

	tc := &tokenCache{
		userTokenCache: make(map[portainer.UserID]string),
	}

	manager.tokenCaches[endpointID] = tc

	return tc
}

// RemoveUserFromCache will ensure that the specific userID is removed from all registered caches.
func (manager *TokenCacheManager) RemoveUserFromCache(userID portainer.UserID) {
	manager.mu.Lock()
	for _, tc := range manager.tokenCaches {
		tc.removeToken(userID)
	}
	manager.mu.Unlock()
}

func (cache *tokenCache) getOrAddToken(userID portainer.UserID, tokenGetFunc func() (string, error)) (string, error) {
	cache.mu.Lock()
	defer cache.mu.Unlock()

	if tok, ok := cache.userTokenCache[userID]; ok {
		return tok, nil
	}

	tok, err := tokenGetFunc()
	if err != nil {
		return "", err
	}

	cache.userTokenCache[userID] = tok

	return tok, nil
}

func (cache *tokenCache) removeToken(userID portainer.UserID) {
	cache.mu.Lock()
	delete(cache.userTokenCache, userID)
	cache.mu.Unlock()
}
