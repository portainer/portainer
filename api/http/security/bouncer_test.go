package security

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/jwt"
	"github.com/stretchr/testify/assert"
)

// testHandler200 is a simple handler which returns HTTP status 200 OK
var testHandler200 = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

func verificationFuncSucceedWrapper(dataStore portainer.DataStore, jwtService portainer.JWTService) verificationFunc {
	return func(r *http.Request) (*portainer.TokenData, *authError) {
		uid := portainer.UserID(1)
		dataStore.User().CreateUser(&portainer.User{ID: uid})
		jwtService.GenerateToken(&portainer.TokenData{ID: uid})
		return &portainer.TokenData{ID: 1}, nil
	}
}

func verificationFuncFailWrapper(authErr authError) verificationFunc {
	return func(r *http.Request) (*portainer.TokenData, *authError) {
		return nil, &authErr
	}
}

func verificationFuncFail(r *http.Request) (*portainer.TokenData, *authError) {
	return nil, &authError{statusCode: http.StatusUnauthorized, message: "Unauthorized", err: httperrors.ErrUnauthorized}
}

func Test_mwAnyAuth(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	jwtService, err := jwt.NewService("1h", nil)
	assert.NoError(t, err, "failed to create a copy of service")

	bouncer := NewRequestBouncer(store, jwtService)

	tests := []struct {
		name                   string
		verificationMiddlwares []verificationFunc
		wantStatusCode         int
	}{
		{
			name:                   "mwAnyAuth middleware passes with no middleware",
			verificationMiddlwares: nil,
			wantStatusCode:         http.StatusUnauthorized,
		},
		{
			name: "mwAnyAuth middleware succeeds with passing middleware",
			verificationMiddlwares: []verificationFunc{
				verificationFuncSucceedWrapper(store, jwtService),
			},
			wantStatusCode: http.StatusOK,
		},
		{
			name: "mwAnyAuth fails with failing middleware",
			verificationMiddlwares: []verificationFunc{
				verificationFuncFail,
			},
			wantStatusCode: http.StatusUnauthorized,
		},
		{
			name: "mwAnyAuth succeeds if first middleware successfully handles request",
			verificationMiddlwares: []verificationFunc{
				verificationFuncSucceedWrapper(store, jwtService),
				verificationFuncFail,
			},
			wantStatusCode: http.StatusOK,
		},
		{
			name: "mwAnyAuth succeeds if last middleware successfully handles request",
			verificationMiddlwares: []verificationFunc{
				verificationFuncFail,
				verificationFuncSucceedWrapper(store, jwtService),
			},
			wantStatusCode: http.StatusOK,
		},
		{
			name: "mwAnyAuth returns unauthorized if all middlewares fail",
			verificationMiddlwares: []verificationFunc{
				verificationFuncFailWrapper(authError{http.StatusInternalServerError, "Internal Server Error", httperrors.ErrResourceAccessDenied}),
				verificationFuncFailWrapper(authError{http.StatusForbidden, "Forbidden", httperrors.ErrEndpointAccessDenied}),
			},
			wantStatusCode: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rr := httptest.NewRecorder()

			h := bouncer.mwAnyAuth(tt.verificationMiddlwares, testHandler200)
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
