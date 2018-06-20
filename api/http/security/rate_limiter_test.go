package security

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestLimitAccess(t *testing.T) {
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	t.Run("Request below the limit", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		rr := httptest.NewRecorder()
		rateLimiter := NewRateLimiter(10, 1*time.Second, 1*time.Hour)
		handler := rateLimiter.LimitAccess(testHandler)

		handler.ServeHTTP(rr, req)

		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusOK)
		}
	})

	t.Run("Request above the limit", func(t *testing.T) {
		rateLimiter := NewRateLimiter(1, 1*time.Second, 1*time.Hour)
		handler := rateLimiter.LimitAccess(testHandler)

		ts := httptest.NewServer(handler)
		defer ts.Close()
		http.Get(ts.URL)
		resp, err := http.Get(ts.URL)
		if err != nil {
			t.Fatal(err)
		}

		if status := resp.StatusCode; status != http.StatusForbidden {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusForbidden)
		}
	})
}

func TestStripAddrPort(t *testing.T) {
	t.Run("IP with port", func(t *testing.T) {
		result := StripAddrPort("127.0.0.1:1000")
		if result != "127.0.0.1" {
			t.Errorf("Expected IP with address to be '127.0.0.1', but it was %s instead", result)
		}
	})

	t.Run("IP without port", func(t *testing.T) {
		result := StripAddrPort("127.0.0.1")
		if result != "127.0.0.1" {
			t.Errorf("Expected IP with address to be '127.0.0.1', but it was %s instead", result)
		}
	})

	t.Run("Local IP", func(t *testing.T) {
		result := StripAddrPort("[::1]:1000")
		if result != "[::1]" {
			t.Errorf("Expected IP with address to be '[::1]', but it was %s instead", result)
		}
	})
}
