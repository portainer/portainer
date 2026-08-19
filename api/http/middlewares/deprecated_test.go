package middlewares

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDeprecated(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name               string
		urlBuilder         func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError)
		requestPath        string
		expectedStatusCode int
		expectedPath       string
		expectRedirect     bool
	}{
		{
			name: "empty URL - no redirect",
			urlBuilder: func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
				return "", nil
			},
			requestPath:        "/api/old",
			expectedStatusCode: http.StatusOK,
			expectedPath:       "/api/old",
			expectRedirect:     false,
		},
		{
			name: "new URL provided - redirects",
			urlBuilder: func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
				return "/api/new", nil
			},
			requestPath:        "/api/old",
			expectedStatusCode: http.StatusOK,
			expectedPath:       "/api/new",
			expectRedirect:     true,
		},
		{
			name: "urlBuilder returns error - returns error response",
			urlBuilder: func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
				return "", httperror.BadRequest("invalid request", nil)
			},
			requestPath:        "/api/old",
			expectedStatusCode: http.StatusBadRequest,
			expectedPath:       "",
			expectRedirect:     false,
		},
		{
			name: "urlBuilder returns server error",
			urlBuilder: func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
				return "", httperror.InternalServerError("server error", nil)
			},
			requestPath:        "/api/old",
			expectedStatusCode: http.StatusInternalServerError,
			expectedPath:       "",
			expectRedirect:     false,
		},
		{
			name: "dynamic URL based on request path",
			urlBuilder: func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
				return "/v2" + r.URL.Path, nil
			},
			requestPath:        "/api/resource/123",
			expectedStatusCode: http.StatusOK,
			expectedPath:       "/v2/api/resource/123",
			expectRedirect:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a test handler that records the request path
			var handledPath string
			testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handledPath = r.URL.Path
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte("success"))
			})

			// Wrap with Deprecated middleware
			wrappedHandler := Deprecated(testHandler, tt.urlBuilder)

			// Create test request
			req := httptest.NewRequest(http.MethodGet, tt.requestPath, nil)
			rec := httptest.NewRecorder()

			// Execute request
			wrappedHandler.ServeHTTP(rec, req)

			// Check status code
			assert.Equal(t, tt.expectedStatusCode, rec.Code, "unexpected status code")

			// For error cases, don't check the path
			if tt.expectedStatusCode >= 400 {
				return
			}

			// Check that the correct path was handled
			if tt.expectRedirect {
				assert.Equal(t, tt.expectedPath, handledPath, "path was not redirected correctly")
			} else {
				assert.Equal(t, tt.requestPath, handledPath, "original path was not preserved")
			}

			// Check response body for success cases
			body, err := io.ReadAll(rec.Body)
			require.NoError(t, err)
			assert.Equal(t, "success", string(body), "unexpected response body")
		})
	}
}

func TestDeprecatedSimple(t *testing.T) {
	t.Parallel()
	// Create a test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("test response"))
	})

	// Wrap with DeprecatedSimple middleware
	wrappedHandler := DeprecatedSimple(testHandler)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	rec := httptest.NewRecorder()

	// Execute request
	wrappedHandler.ServeHTTP(rec, req)

	// Check that request was successful
	assert.Equal(t, http.StatusOK, rec.Code, "unexpected status code")

	// Check response body
	body, err := io.ReadAll(rec.Body)
	require.NoError(t, err)
	assert.Equal(t, "test response", string(body), "unexpected response body")
}

func TestDeprecated_PreservesRequestContext(t *testing.T) {
	t.Parallel()
	// Test that the middleware preserves request context when redirecting
	urlBuilder := func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "/new-path", nil
	}

	var receivedRequest *http.Request
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedRequest = r
		w.WriteHeader(http.StatusOK)
	})

	wrappedHandler := Deprecated(testHandler, urlBuilder)

	req := httptest.NewRequest(http.MethodGet, "/old-path", nil)
	rec := httptest.NewRecorder()

	wrappedHandler.ServeHTTP(rec, req)

	require.NotNil(t, receivedRequest, "request was not passed to handler")
	assert.Equal(t, req.Context(), receivedRequest.Context(), "request context was not preserved")
}

func TestDeprecated_PreservesRequestMethod(t *testing.T) {
	t.Parallel()
	methods := []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

	urlBuilder := func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "/new-path", nil
	}

	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			var receivedMethod string
			testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				receivedMethod = r.Method
				w.WriteHeader(http.StatusOK)
			})

			wrappedHandler := Deprecated(testHandler, urlBuilder)

			req := httptest.NewRequest(method, "/old-path", nil)
			rec := httptest.NewRecorder()

			wrappedHandler.ServeHTTP(rec, req)

			assert.Equal(t, method, receivedMethod, "HTTP method was not preserved")
		})
	}
}

func TestDeprecated_PreservesRequestHeaders(t *testing.T) {
	t.Parallel()
	urlBuilder := func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "/new-path", nil
	}

	var receivedHeaders http.Header
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedHeaders = r.Header
		w.WriteHeader(http.StatusOK)
	})

	wrappedHandler := Deprecated(testHandler, urlBuilder)

	req := httptest.NewRequest(http.MethodGet, "/old-path", nil)
	req.Header.Set("Authorization", "Bearer token123")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	wrappedHandler.ServeHTTP(rec, req)

	assert.Equal(t, "Bearer token123", receivedHeaders.Get("Authorization"), "Authorization header was not preserved")
	assert.Equal(t, "application/json", receivedHeaders.Get("Content-Type"), "Content-Type header was not preserved")
}

func TestDeprecated_PreservesRequestBody(t *testing.T) {
	t.Parallel()
	urlBuilder := func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "/new-path", nil
	}

	var receivedBody string
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		receivedBody = string(body)
		w.WriteHeader(http.StatusOK)
	})

	wrappedHandler := Deprecated(testHandler, urlBuilder)

	req := httptest.NewRequest(http.MethodPost, "/old-path", http.NoBody)
	rec := httptest.NewRecorder()

	wrappedHandler.ServeHTTP(rec, req)

	// Body should be preserved (empty in this case since we used http.NoBody)
	assert.Empty(t, receivedBody, "expected empty body")
}

func TestDeprecated_ErrorResponseFormat(t *testing.T) {
	t.Parallel()
	urlBuilder := func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "", httperror.BadRequest("test error message", nil)
	}

	handlerCalled := false
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		w.WriteHeader(http.StatusOK)
	})

	wrappedHandler := Deprecated(testHandler, urlBuilder)

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	rec := httptest.NewRecorder()

	wrappedHandler.ServeHTTP(rec, req)

	assert.False(t, handlerCalled, "handler should not be called when urlBuilder returns error")
	assert.Equal(t, http.StatusBadRequest, rec.Code, "unexpected status code")

	// The httperror.WriteError function should have written the error response
	body, err := io.ReadAll(rec.Body)
	require.NoError(t, err)
	assert.NotEmpty(t, body, "expected error response body")
}

func TestDeprecated_WithQueryParameters(t *testing.T) {
	t.Parallel()
	urlBuilder := func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "/api/v2/resource", nil
	}

	var receivedQuery string
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedQuery = r.URL.RawQuery
		w.WriteHeader(http.StatusOK)
	})

	wrappedHandler := Deprecated(testHandler, urlBuilder)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/resource?filter=active&sort=name", nil)
	rec := httptest.NewRecorder()

	wrappedHandler.ServeHTTP(rec, req)

	assert.Equal(t, "filter=active&sort=name", receivedQuery, "query parameters were not preserved")
}

func TestDeprecated_WithMultipleRedirects(t *testing.T) {
	t.Parallel()
	// Test that multiple deprecated middleware can be chained
	urlBuilder1 := func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "/v2" + r.URL.Path, nil
	}

	urlBuilder2 := func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "/api" + r.URL.Path, nil
	}

	var finalPath string
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		finalPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	})

	// Chain two deprecated middlewares
	wrappedHandler := Deprecated(Deprecated(testHandler, urlBuilder2), urlBuilder1)

	req := httptest.NewRequest(http.MethodGet, "/old", nil)
	rec := httptest.NewRecorder()

	wrappedHandler.ServeHTTP(rec, req)

	// First middleware redirects to /v2/old
	// Second middleware redirects to /api/v2/old
	assert.Equal(t, "/api/v2/old", finalPath, "chained redirects did not work correctly")
}
