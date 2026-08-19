package images

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestAggregateImageStatus(t *testing.T) {
	t.Parallel()

	f := func(statuses []Status, expected Status) {
		t.Helper()
		require.Equal(t, expected, AggregateImageStatus(statuses))
	}

	f([]Status{Skipped, Skipped, Skipped}, Skipped)
	f([]Status{Preparing, Preparing}, Preparing)
	f([]Status{Updated, Outdated, Processing, Error}, Outdated)
	f([]Status{Updated, Processing, Error}, Processing)
	f([]Status{Updated, Error}, Error)
	f([]Status{Updated, Updated}, Updated)
	f([]Status{}, Updated)
	f([]Status{Updated, Skipped}, Updated)
}

func TestCachedResourceImageStatusMiss(t *testing.T) {
	t.Parallel()

	_, err := CachedResourceImageStatus("status-test-miss-key")
	require.Error(t, err)
}

func TestCachedResourceImageStatusHitAndEvict(t *testing.T) {
	t.Parallel()

	key := "status-test-hit-evict-key"

	CacheResourceImageStatus(key, Updated)

	s, err := CachedResourceImageStatus(key)
	require.NoError(t, err)
	require.Equal(t, Updated, s)

	EvictImageStatus(key)

	_, err = CachedResourceImageStatus(key)
	require.Error(t, err)
}

func TestCacheErrorImageStatus(t *testing.T) {
	t.Parallel()

	key := "status-test-error-key"

	CacheErrorImageStatus(key)

	s, err := CachedResourceImageStatus(key)
	require.NoError(t, err)
	require.Equal(t, Error, s)

	EvictImageStatus(key)
}
