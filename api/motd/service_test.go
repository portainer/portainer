package motd

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetCached_InitiallyEmpty(t *testing.T) {
	t.Parallel()
	svc := NewService("http://unused")
	assert.Equal(t, Motd{}, svc.GetCached())
}

func TestRefresh_Success_PopulatesCache(t *testing.T) {
	t.Parallel()
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"title":"Test title","message":["Hello","world"]}`))
	}))
	defer ts.Close()

	svc := NewService(ts.URL)
	svc.refresh()

	result := svc.GetCached()
	assert.Equal(t, "Test title", result.Title)
	assert.Equal(t, "Hello\nworld", result.Message)
	assert.NotEmpty(t, result.Hash)
}

func TestRefresh_FetchError_KeepsPreviousCache(t *testing.T) {
	t.Parallel()
	// First populate cache with good data
	good := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"title":"Cached","message":["Cached message"]}`))
	}))
	defer good.Close()

	svc := NewService(good.URL)
	svc.refresh()
	assert.Equal(t, "Cached", svc.GetCached().Title)

	// Now point at a failing server and refresh
	svc.motdURL = "http://127.0.0.1:0" // unreachable
	svc.refresh()

	// Cache should be unchanged
	assert.Equal(t, "Cached", svc.GetCached().Title)
}

func TestRefresh_InvalidJSON_KeepsPreviousCache(t *testing.T) {
	t.Parallel()
	good := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"title":"Cached","message":["Cached message"]}`))
	}))
	defer good.Close()

	svc := NewService(good.URL)
	svc.refresh()
	assert.Equal(t, "Cached", svc.GetCached().Title)

	// Serve invalid JSON
	bad := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`not json`))
	}))
	defer bad.Close()

	svc.motdURL = bad.URL
	svc.refresh()

	assert.Equal(t, "Cached", svc.GetCached().Title)
}

func TestRefresh_FetchError_CacheRemainsEmpty(t *testing.T) {
	t.Parallel()
	svc := NewService("http://127.0.0.1:0") // unreachable
	svc.refresh()
	assert.Equal(t, Motd{}, svc.GetCached())
}
