package security

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/stretchr/testify/assert"
)

// testHandler200 is a simple handler which returns HTTP status 200 OK
var testHandler200 = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

// mwSucceedAfterDuration is a simple middleware which succeeds after specified duration
// for tests, we can specify desired HTTP status code to check for
func mwSucceedAfterDuration(d time.Duration, httpStatusCode int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			time.Sleep(d)

			// override response code to signal that middleware has succeeded
			w.WriteHeader(httpStatusCode)

			next.ServeHTTP(w, r)
		})
	}
}

// mwFailAfterDuration is a simple middleware which fails after specified duration with specified HTTP status code
func mwFailAfterDuration(d time.Duration, httpStatusCode int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			time.Sleep(d)
			http.Error(w, "Malformed Content-Type header", httpStatusCode)
		})
	}
}

// define instantly succeeding and failing middlewares
var mwPassEveryRequest = mwSucceedAfterDuration(0, http.StatusFound)
var mwFailEveryRequest = mwFailAfterDuration(0, http.StatusBadRequest)

// Test_middlewares is a set of simple tests to validate testing middlewares declared above so that they can be
// utilised in more complex tests below.
func Test_middlewares(t *testing.T) {
	is := assert.New(t)

	req := httptest.NewRequest(http.MethodGet, "/", nil)

	t.Run("mwPassEveryRequest passes with HTTP 302", func(t *testing.T) {
		rr := httptest.NewRecorder()

		h := mwPassEveryRequest(testHandler200)
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusFound, rr.Code, "Status should be 302 Found")
	})

	t.Run("mwFailEveryRequest fails with HTTP 400", func(t *testing.T) {
		rr := httptest.NewRecorder()

		h := mwFailEveryRequest(testHandler200)
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusBadRequest, rr.Code, "Status should be 400 Bad Request")
	})
}

func Test_AnyAuth(t *testing.T) {
	is := assert.New(t)
	bouncer := NewRequestBouncer(nil, nil)

	tests := []struct {
		name            string
		inputMiddlwares []mux.MiddlewareFunc
		wantStatusCode  int
	}{
		{
			name:            "AnyAuth middleware passes with no middleware",
			inputMiddlwares: nil,
			wantStatusCode:  http.StatusOK,
		},
		{
			name:            "AnyAuth middleware succeeds with passing middleware",
			inputMiddlwares: []mux.MiddlewareFunc{mwPassEveryRequest},
			wantStatusCode:  http.StatusFound,
		},
		{
			name:            "AnyAuth fails with failing middleware",
			inputMiddlwares: []mux.MiddlewareFunc{mwFailEveryRequest},
			wantStatusCode:  http.StatusBadRequest,
		},
		{
			name: "AnyAuth succeeds if first middleware successfully handles request",
			inputMiddlwares: []mux.MiddlewareFunc{
				mwPassEveryRequest,
				mwFailEveryRequest,
			},
			wantStatusCode: http.StatusFound,
		},
		{
			name: "AnyAuth succeeds if last middleware successfully handles request",
			inputMiddlwares: []mux.MiddlewareFunc{
				mwFailEveryRequest,
				mwPassEveryRequest,
			},
			wantStatusCode: http.StatusFound,
		},
		{
			name: "AnyAuth succeeds if first middleware successfully handles request after a failing middleware",
			inputMiddlwares: []mux.MiddlewareFunc{
				mwSucceedAfterDuration(time.Millisecond*50, http.StatusFound),
				mwFailEveryRequest,
			},
			wantStatusCode: http.StatusFound,
		},
		{
			name: "AnyAuth succeeds if last middleware successfully handles request after a failing middleware",
			inputMiddlwares: []mux.MiddlewareFunc{
				mwFailEveryRequest,
				mwSucceedAfterDuration(time.Millisecond*50, http.StatusFound),
			},
			wantStatusCode: http.StatusFound,
		},
		{
			name: "AnyAuth succeeds if any middleware passes regardless of order and time",
			inputMiddlwares: []mux.MiddlewareFunc{
				mwFailEveryRequest,
				mwSucceedAfterDuration(time.Millisecond*25, http.StatusFound),
				mwFailAfterDuration(time.Millisecond*50, http.StatusUnauthorized),
			},
			wantStatusCode: http.StatusFound,
		},
		{
			name: "AnyAuth uses last succeeding middleware if multiple middlewares pass",
			inputMiddlwares: []mux.MiddlewareFunc{
				mwFailEveryRequest,
				mwPassEveryRequest,
				mwSucceedAfterDuration(time.Millisecond*25, http.StatusOK),
				mwSucceedAfterDuration(time.Millisecond*50, http.StatusAccepted), // is used since latest succeeding middleware
			},
			wantStatusCode: http.StatusAccepted,
		},
		{
			name: "AnyAuth uses first failing middleware if all middlewares fail",
			inputMiddlwares: []mux.MiddlewareFunc{
				mwFailEveryRequest, // is used since earliest failing middleware
				mwFailAfterDuration(time.Millisecond*25, http.StatusUnauthorized),
				mwFailAfterDuration(time.Millisecond*50, http.StatusForbidden),
			},
			wantStatusCode: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rr := httptest.NewRecorder()

			h := bouncer.AnyAuth(tt.inputMiddlwares, testHandler200)
			h.ServeHTTP(rr, req)

			is.Equal(tt.wantStatusCode, rr.Code, fmt.Sprintf("Status should be %d", tt.wantStatusCode))
		})
	}
}

func Test_extractAPIKey(t *testing.T) {
	is := assert.New(t)

	tt := []struct {
		name               string
		requestHeader      string
		requestHeaderValue string
		wantApiKey         string
		doesError          bool
	}{
		{
			name:               "missing request header",
			requestHeader:      "",
			requestHeaderValue: "",
			wantApiKey:         "",
			doesError:          true,
		},
		{
			name:               "invalid api-key request header",
			requestHeader:      "api-key",
			requestHeaderValue: "abc",
			wantApiKey:         "",
			doesError:          true,
		},
		{
			name:               "valid api-key request header",
			requestHeader:      "X-API-KEY",
			requestHeaderValue: "abc",
			wantApiKey:         "abc",
			doesError:          false,
		},
		{
			name:               "valid api-key request header case-insensitive canonical check",
			requestHeader:      "x-api-key",
			requestHeaderValue: "def",
			wantApiKey:         "def",
			doesError:          false,
		},
	}

	for _, test := range tt {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set(test.requestHeader, test.requestHeaderValue)
		apiKey, err := extractAPIKey(req)
		is.Equal(test.wantApiKey, apiKey)
		if test.doesError {
			is.Error(err, "Should return error")
			is.ErrorIs(err, httperrors.ErrUnauthorized)
		} else {
			is.NoError(err)
		}
	}
}
