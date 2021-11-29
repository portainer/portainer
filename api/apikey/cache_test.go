package apikey

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func Test_apiKeyCacheGet(t *testing.T) {
	is := assert.New(t)

	keyCache := NewAPIKeyCache(10)

	// pre-populate cache
	keyCache.cache.Add(string("foo"), entry{user: portainer.User{}, apiKey: portainer.APIKey{}})
	keyCache.cache.Add(string(""), entry{user: portainer.User{}, apiKey: portainer.APIKey{}})

	tests := []struct {
		digest []byte
		found  bool
	}{
		{
			digest: []byte("foo"),
			found:  true,
		},
		{
			digest: []byte(""),
			found:  true,
		},
		{
			digest: []byte("bar"),
			found:  false,
		},
	}

	for _, test := range tests {
		t.Run(string(test.digest), func(t *testing.T) {
			_, _, found := keyCache.Get(test.digest)
			is.Equal(test.found, found)
		})
	}
}

func Test_apiKeyCacheSet(t *testing.T) {
	is := assert.New(t)

	keyCache := NewAPIKeyCache(10)

	// pre-populate cache
	keyCache.Set([]byte("bar"), portainer.User{ID: 2}, portainer.APIKey{})
	keyCache.Set([]byte("foo"), portainer.User{ID: 1}, portainer.APIKey{})

	// overwrite existing entry
	keyCache.Set([]byte("foo"), portainer.User{ID: 3}, portainer.APIKey{})

	val, ok := keyCache.cache.Get(string("bar"))
	is.True(ok)

	tuple := val.(entry)
	is.Equal(portainer.User{ID: 2}, tuple.user)

	val, ok = keyCache.cache.Get(string("foo"))
	is.True(ok)

	tuple = val.(entry)
	is.Equal(portainer.User{ID: 3}, tuple.user)
}

func Test_apiKeyCacheDelete(t *testing.T) {
	is := assert.New(t)

	keyCache := NewAPIKeyCache(10)

	t.Run("Delete an existing entry", func(t *testing.T) {
		keyCache.cache.Add(string("foo"), entry{user: portainer.User{ID: 1}, apiKey: portainer.APIKey{}})
		keyCache.Delete([]byte("foo"))

		_, ok := keyCache.cache.Get(string("foo"))
		is.False(ok)
	})

	t.Run("Delete a non-existing entry", func(t *testing.T) {
		nonPanicFunc := func() { keyCache.Delete([]byte("non-existent-key")) }
		is.NotPanics(nonPanicFunc)
	})
}

func Test_apiKeyCacheLRU(t *testing.T) {
	is := assert.New(t)

	tests := []struct {
		name        string
		cacheLen    int
		key         []string
		foundKeys   []string
		evictedKeys []string
	}{
		{
			name:        "Cache length is 1, add 2 keys",
			cacheLen:    1,
			key:         []string{"foo", "bar"},
			foundKeys:   []string{"bar"},
			evictedKeys: []string{"foo"},
		},
		{
			name:        "Cache length is 1, add 3 keys",
			cacheLen:    1,
			key:         []string{"foo", "bar", "baz"},
			foundKeys:   []string{"baz"},
			evictedKeys: []string{"foo", "bar"},
		},
		{
			name:        "Cache length is 2, add 3 keys",
			cacheLen:    2,
			key:         []string{"foo", "bar", "baz"},
			foundKeys:   []string{"bar", "baz"},
			evictedKeys: []string{"foo"},
		},
		{
			name:        "Cache length is 2, add 4 keys",
			cacheLen:    2,
			key:         []string{"foo", "bar", "baz", "qux"},
			foundKeys:   []string{"baz", "qux"},
			evictedKeys: []string{"foo", "bar"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			keyCache := NewAPIKeyCache(test.cacheLen)

			for _, key := range test.key {
				keyCache.Set([]byte(key), portainer.User{ID: 1}, portainer.APIKey{})
			}

			for _, key := range test.foundKeys {
				_, _, found := keyCache.Get([]byte(key))
				is.True(found, "Key %s not found", key)
			}

			for _, key := range test.evictedKeys {
				_, _, found := keyCache.Get([]byte(key))
				is.False(found, "key %s should have been evicted", key)
			}
		})
	}
}

func Test_apiKeyCacheInvalidateUserKeyCache(t *testing.T) {
	is := assert.New(t)

	keyCache := NewAPIKeyCache(10)

	t.Run("Removes users keys from cache", func(t *testing.T) {
		keyCache.cache.Add(string("foo"), entry{user: portainer.User{ID: 1}, apiKey: portainer.APIKey{}})

		ok := keyCache.InvalidateUserKeyCache(1)
		is.True(ok)

		_, ok = keyCache.cache.Get(string("foo"))
		is.False(ok)
	})

	t.Run("Does not affect other keys", func(t *testing.T) {
		keyCache.cache.Add(string("foo"), entry{user: portainer.User{ID: 1}, apiKey: portainer.APIKey{}})
		keyCache.cache.Add(string("bar"), entry{user: portainer.User{ID: 2}, apiKey: portainer.APIKey{}})

		ok := keyCache.InvalidateUserKeyCache(1)
		is.True(ok)

		ok = keyCache.InvalidateUserKeyCache(1)
		is.False(ok)

		_, ok = keyCache.cache.Get(string("foo"))
		is.False(ok)

		_, ok = keyCache.cache.Get(string("bar"))
		is.True(ok)
	})
}
