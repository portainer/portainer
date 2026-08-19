package logoutcontext

import (
	"context"
	"sync"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetContext_ReturnsActiveContext(t *testing.T) {
	t.Parallel()

	token := "token-get-context-active"
	defer Cancel(token)

	ctx := GetContext(token)
	require.NoError(t, ctx.Err())
}

func TestCancel_CancelsContext(t *testing.T) {
	t.Parallel()

	token := "token-cancel"

	ctx := GetContext(token)
	require.NoError(t, ctx.Err())

	Cancel(token)

	require.ErrorIs(t, ctx.Err(), context.Canceled)
}

func TestCancel_RemovesService(t *testing.T) {
	t.Parallel()

	token := "token-cancel-removes"

	first := GetContext(token)
	Cancel(token)

	second := GetContext(token)
	defer Cancel(token)

	require.ErrorIs(t, first.Err(), context.Canceled)
	require.NoError(t, second.Err())
	require.NotEqual(t, first, second)
}

func TestGetService_ReturnsSameServiceForSameToken(t *testing.T) {
	t.Parallel()

	token := logoutToken("token-same-service")
	defer RemoveService(token)

	s1 := GetService(token)
	s2 := GetService(token)

	require.Same(t, s1, s2)
}

func TestGetService_ReturnsDistinctServicesForDifferentTokens(t *testing.T) {
	t.Parallel()

	tokenA := logoutToken("token-distinct-a")
	tokenB := logoutToken("token-distinct-b")
	defer RemoveService(tokenA)
	defer RemoveService(tokenB)

	sA := GetService(tokenA)
	sB := GetService(tokenB)

	require.NotSame(t, sA, sB)
}

func TestGetService_ConcurrentAccess(t *testing.T) {
	t.Parallel()

	const goroutines = 50
	token := logoutToken("token-concurrent")
	defer RemoveService(token)

	var wg sync.WaitGroup
	services := make([]*Service, goroutines)

	for i := range goroutines {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			services[i] = GetService(token)
		}(i)
	}

	wg.Wait()

	for i := 1; i < goroutines; i++ {
		require.Same(t, services[0], services[i])
	}
}

func TestLogoutToken_AddsPrefix(t *testing.T) {
	t.Parallel()

	result := logoutToken("abc123")
	require.Equal(t, LogoutPrefix+"abc123", result)
}
