package security

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/portainer/portainer/pkg/libhttp"

	"github.com/stretchr/testify/require"
)

func TestLimitAccess(t *testing.T) {
	t.Parallel()
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

	t.Run("Request below the limit", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		rr := httptest.NewRecorder()
		rateLimiter := NewRateLimiter(10, 1*time.Second, 1*time.Hour, nil)
		handler := rateLimiter.LimitAccess(testHandler)

		handler.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusOK)
		}
	})

	t.Run("Request above the limit", func(t *testing.T) {
		rateLimiter := NewRateLimiter(1, 1*time.Second, 1*time.Hour, nil)
		handler := rateLimiter.LimitAccess(testHandler)

		ts := httptest.NewServer(handler)
		defer ts.Close()

		resp, err := http.Get(ts.URL)
		if err == nil {
			err = resp.Body.Close()
			require.NoError(t, err)
		}

		resp, err = http.Get(ts.URL)
		if err != nil {
			t.Fatal(err)
		}

		_, _ = io.Copy(io.Discard, resp.Body)
		err = resp.Body.Close()
		require.NoError(t, err)

		if status := resp.StatusCode; status != http.StatusForbidden {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusForbidden)
		}
	})
}

func TestLimitAccess_TrustedProxyTracksEachClientSeparately(t *testing.T) {
	t.Parallel()

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

	trustedProxies, err := libhttp.ParseTrustedProxies([]string{"127.0.0.1/32"})
	require.NoError(t, err)

	rateLimiter := NewRateLimiter(1, 1*time.Second, 1*time.Hour, trustedProxies)
	handler := rateLimiter.LimitAccess(testHandler)

	clientA := httptest.NewRequest("GET", "/", nil)
	clientA.RemoteAddr = "127.0.0.1:11111"
	clientA.Header.Set("X-Forwarded-For", "203.0.113.1")

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, clientA)
	require.Equal(t, http.StatusOK, rr.Code)

	// Client B is behind the same trusted proxy as client A, so it shares
	// the same RemoteAddr, but has its own resolved client IP and is
	// therefore unaffected by client A's usage.
	clientB := httptest.NewRequest("GET", "/", nil)
	clientB.RemoteAddr = "127.0.0.1:22222"
	clientB.Header.Set("X-Forwarded-For", "203.0.113.2")

	rr = httptest.NewRecorder()
	handler.ServeHTTP(rr, clientB)
	require.Equal(t, http.StatusOK, rr.Code)

	// Client A exceeding its own limit is still banned.
	clientARepeat := httptest.NewRequest("GET", "/", nil)
	clientARepeat.RemoteAddr = "127.0.0.1:11111"
	clientARepeat.Header.Set("X-Forwarded-For", "203.0.113.1")

	rr = httptest.NewRecorder()
	handler.ServeHTTP(rr, clientARepeat)
	require.Equal(t, http.StatusForbidden, rr.Code)
}

func TestLimitAccess_UntrustedPeerCannotBypassItsOwnLimitBySpoofing(t *testing.T) {
	t.Parallel()

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

	trustedProxies, err := libhttp.ParseTrustedProxies([]string{"127.0.0.1/32"})
	require.NoError(t, err)

	rateLimiter := NewRateLimiter(1, 1*time.Second, 1*time.Hour, trustedProxies)
	handler := rateLimiter.LimitAccess(testHandler)

	untrusted := httptest.NewRequest("GET", "/", nil)
	untrusted.RemoteAddr = "198.51.100.1:33333"
	untrusted.Header.Set("X-Forwarded-For", "203.0.113.3")

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, untrusted)
	require.Equal(t, http.StatusOK, rr.Code)

	// Since 198.51.100.1 is not a trusted proxy, its own address is used
	// as the bucket key regardless of X-Forwarded-For, so spoofing a
	// different value on the next request does not open a fresh bucket.
	untrustedRepeatSpoofed := httptest.NewRequest("GET", "/", nil)
	untrustedRepeatSpoofed.RemoteAddr = "198.51.100.1:33333"
	untrustedRepeatSpoofed.Header.Set("X-Forwarded-For", "203.0.113.4")

	rr = httptest.NewRecorder()
	handler.ServeHTTP(rr, untrustedRepeatSpoofed)
	require.Equal(t, http.StatusForbidden, rr.Code)
}
