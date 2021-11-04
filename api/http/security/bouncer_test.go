package security

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/bolt"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/jwt"
	"github.com/stretchr/testify/assert"
)

// testHandler200 is a simple handler which returns HTTP status 200 OK
var testHandler200 = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

func tokenLookupSucceed(dataStore portainer.DataStore, jwtService portainer.JWTService) tokenLookup {
	return func(r *http.Request) *portainer.TokenData {
		uid := portainer.UserID(1)
		dataStore.User().CreateUser(&portainer.User{ID: uid})
		jwtService.GenerateToken(&portainer.TokenData{ID: uid})
		return &portainer.TokenData{ID: 1}
	}
}

func tokenLookupFail(r *http.Request) *portainer.TokenData {
	return nil
}

func Test_mwAuthenticateFirst(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	jwtService, err := jwt.NewService("1h", nil)
	assert.NoError(t, err, "failed to create a copy of service")

	apiKeyService := apikey.NewAPIKeyService(nil, nil)

	bouncer := NewRequestBouncer(store, jwtService, apiKeyService)

	tests := []struct {
		name                   string
		verificationMiddlwares []tokenLookup
		wantStatusCode         int
	}{
		{
			name:                   "mwAuthenticateFirst middleware passes with no middleware",
			verificationMiddlwares: nil,
			wantStatusCode:         http.StatusUnauthorized,
		},
		{
			name: "mwAuthenticateFirst middleware succeeds with passing middleware",
			verificationMiddlwares: []tokenLookup{
				tokenLookupSucceed(store, jwtService),
			},
			wantStatusCode: http.StatusOK,
		},
		{
			name: "mwAuthenticateFirst fails with failing middleware",
			verificationMiddlwares: []tokenLookup{
				tokenLookupFail,
			},
			wantStatusCode: http.StatusUnauthorized,
		},
		{
			name: "mwAuthenticateFirst succeeds if first middleware successfully handles request",
			verificationMiddlwares: []tokenLookup{
				tokenLookupSucceed(store, jwtService),
				tokenLookupFail,
			},
			wantStatusCode: http.StatusOK,
		},
		{
			name: "mwAuthenticateFirst succeeds if last middleware successfully handles request",
			verificationMiddlwares: []tokenLookup{
				tokenLookupFail,
				tokenLookupSucceed(store, jwtService),
			},
			wantStatusCode: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rr := httptest.NewRecorder()

			h := bouncer.mwAuthenticateFirst(tt.verificationMiddlwares, testHandler200)
			h.ServeHTTP(rr, req)

			is.Equal(tt.wantStatusCode, rr.Code, fmt.Sprintf("Status should be %d", tt.wantStatusCode))
		})
	}
}

func Test_extractBearerToken(t *testing.T) {
	is := assert.New(t)

	tt := []struct {
		name               string
		requestHeader      string
		requestHeaderValue string
		wantToken          string
		doesError          bool
	}{
		{
			name:               "missing request header",
			requestHeader:      "",
			requestHeaderValue: "",
			wantToken:          "",
			doesError:          true,
		},
		{
			name:               "invalid authorization request header",
			requestHeader:      "authorisation", // note: `s`
			requestHeaderValue: "abc",
			wantToken:          "",
			doesError:          true,
		},
		{
			name:               "valid authorization request header",
			requestHeader:      "AUTHORIZATION",
			requestHeaderValue: "abc",
			wantToken:          "abc",
			doesError:          false,
		},
		{
			name:               "valid authorization request header case-insensitive canonical check",
			requestHeader:      "authorization",
			requestHeaderValue: "def",
			wantToken:          "def",
			doesError:          false,
		},
	}

	for _, test := range tt {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set(test.requestHeader, test.requestHeaderValue)
		apiKey, err := extractBearerToken(req)
		is.Equal(test.wantToken, apiKey)
		if test.doesError {
			is.Error(err, "Should return error")
			is.ErrorIs(err, httperrors.ErrUnauthorized)
		} else {
			is.NoError(err)
		}
	}
}

func Test_extractAPIKey(t *testing.T) {
	is := assert.New(t)

	tt := []struct {
		name               string
		requestHeader      string
		requestHeaderValue string
		wantApiKey         string
		succeeds           bool
	}{
		{
			name:               "missing request header",
			requestHeader:      "",
			requestHeaderValue: "",
			wantApiKey:         "",
			succeeds:           false,
		},
		{
			name:               "invalid api-key request header",
			requestHeader:      "api-key",
			requestHeaderValue: "abc",
			wantApiKey:         "",
			succeeds:           false,
		},
		{
			name:               "valid api-key request header",
			requestHeader:      apiKeyHeader,
			requestHeaderValue: "abc",
			wantApiKey:         "abc",
			succeeds:           true,
		},
		{
			name:               "valid api-key request header case-insensitive canonical check",
			requestHeader:      "x-api-key",
			requestHeaderValue: "def",
			wantApiKey:         "def",
			succeeds:           true,
		},
	}

	for _, test := range tt {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set(test.requestHeader, test.requestHeaderValue)
		apiKey, ok := extractAPIKey(req)
		is.Equal(test.wantApiKey, apiKey)
		is.Equal(test.succeeds, ok)
	}
}
