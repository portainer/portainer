package security

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// testHandler200 is a simple handler which returns HTTP status 200 OK
var testHandler200 = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

func tokenLookupSucceed(dataStore dataservices.DataStore, jwtService portainer.JWTService) tokenLookup {
	return func(r *http.Request) (*portainer.TokenData, error) {
		uid := portainer.UserID(1)
		dataStore.User().Create(&portainer.User{ID: uid})
		jwtService.GenerateToken(&portainer.TokenData{ID: uid})
		return &portainer.TokenData{ID: 1}, nil
	}
}

func tokenLookupFail(r *http.Request) (*portainer.TokenData, error) {
	return nil, ErrInvalidKey
}

func tokenLookupEmpty(r *http.Request) (*portainer.TokenData, error) {
	return nil, nil
}

func Test_mwAuthenticateFirst(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)

	jwtService, err := jwt.NewService("1h", store)
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
			name: "mwAuthenticateFirst fails if first middleware fails",
			verificationMiddlwares: []tokenLookup{
				tokenLookupFail,
				tokenLookupSucceed(store, jwtService),
			},
			wantStatusCode: http.StatusUnauthorized,
		},
		{
			name: "mwAuthenticateFirst fails if first middleware has no token, but second middleware fails",
			verificationMiddlwares: []tokenLookup{
				tokenLookupEmpty,
				tokenLookupFail,

				tokenLookupSucceed(store, jwtService),
			},
			wantStatusCode: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			is := assert.New(t)
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rr := httptest.NewRecorder()

			h := bouncer.mwAuthenticateFirst(tt.verificationMiddlwares, testHandler200)
			h.ServeHTTP(rr, req)

			is.Equal(tt.wantStatusCode, rr.Code, fmt.Sprintf("Status should be %d", tt.wantStatusCode))
		})
	}
}

func Test_extractKeyFromCookie(t *testing.T) {
	is := assert.New(t)

	tt := []struct {
		name     string
		token    string
		succeeds bool
	}{
		{
			name:     "missing cookie",
			token:    "",
			succeeds: false,
		},

		{
			name:     "valid cookie",
			token:    "abc",
			succeeds: true,
		},
	}

	for _, test := range tt {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		if test.token != "" {
			testhelpers.AddTestSecurityCookie(req, test.token)
		}

		apiKey, err := extractKeyFromCookie(req)
		is.Equal(test.token, apiKey)
		if !test.succeeds {
			is.Error(err, "Should return error")
			is.ErrorIs(err, http.ErrNoCookie)
		} else {
			is.NoError(err)
		}
	}
}

func Test_extractBearerToken(t *testing.T) {
	tt := []struct {
		name               string
		requestHeader      string
		requestHeaderValue string
		wantToken          string
		succeeds           bool
	}{
		{
			name:               "missing request header",
			requestHeader:      "",
			requestHeaderValue: "",
			wantToken:          "",
			succeeds:           false,
		},
		{
			name:               "invalid authorization request header",
			requestHeader:      "authorisation", // note: `s`
			requestHeaderValue: "abc",
			wantToken:          "",
			succeeds:           false,
		},
		{
			name:               "valid authorization request header",
			requestHeader:      "AUTHORIZATION",
			requestHeaderValue: "abc",
			wantToken:          "abc",
			succeeds:           true,
		},
		{
			name:               "valid authorization request header case-insensitive canonical check",
			requestHeader:      "authorization",
			requestHeaderValue: "def",
			wantToken:          "def",
			succeeds:           true,
		},
	}

	for _, test := range tt {
		t.Run(test.name, func(t *testing.T) {
			is := assert.New(t)
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.Header.Set(test.requestHeader, test.requestHeaderValue)
			apiKey, ok := extractBearerToken(req)
			is.Equal(test.wantToken, apiKey)
			is.Equal(test.succeeds, ok)
		})
	}
}

func Test_extractAPIKeyHeader(t *testing.T) {
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

func Test_extractAPIKeyQueryParam(t *testing.T) {
	is := assert.New(t)

	tt := []struct {
		name            string
		queryParam      string
		queryParamValue string
		wantApiKey      string
		succeeds        bool
	}{
		{
			name:            "missing request header",
			queryParam:      "",
			queryParamValue: "",
			wantApiKey:      "",
			succeeds:        false,
		},
		{
			name:            "invalid api-key request header",
			queryParam:      "api-key",
			queryParamValue: "abc",
			wantApiKey:      "",
			succeeds:        false,
		},
		{
			name:            "valid api-key request header",
			queryParam:      apiKeyHeader,
			queryParamValue: "abc",
			wantApiKey:      "abc",
			succeeds:        true,
		},
		{
			name:            "valid api-key request header case-insensitive canonical check",
			queryParam:      "x-api-key",
			queryParamValue: "def",
			wantApiKey:      "def",
			succeeds:        true,
		},
	}

	for _, test := range tt {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		q := req.URL.Query()
		q.Add(test.queryParam, test.queryParamValue)
		req.URL.RawQuery = q.Encode()

		apiKey, ok := extractAPIKey(req)
		is.Equal(test.wantApiKey, apiKey)
		is.Equal(test.succeeds, ok)
	}
}

func Test_apiKeyLookup(t *testing.T) {
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create standard user
	user := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	err := store.User().Create(user)
	is.NoError(err, "error creating user")

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	is.NoError(err, "Error initiating jwt service")
	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	bouncer := NewRequestBouncer(store, jwtService, apiKeyService)

	t.Run("missing x-api-key header fails api-key lookup", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		// testhelpers.AddTestSecurityCookie(req, jwt)
		token, _ := bouncer.apiKeyLookup(req)
		is.Nil(token)
	})

	t.Run("invalid x-api-key header fails api-key lookup", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Add("x-api-key", "random-failing-api-key")
		token, err := bouncer.apiKeyLookup(req)
		is.Nil(token)
		is.Error(err)
	})

	t.Run("valid x-api-key header succeeds api-key lookup", func(t *testing.T) {
		rawAPIKey, _, err := apiKeyService.GenerateApiKey(*user, "test")
		is.NoError(err)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Add("x-api-key", rawAPIKey)

		token, err := bouncer.apiKeyLookup(req)

		expectedToken := &portainer.TokenData{ID: user.ID, Username: user.Username, Role: portainer.StandardUserRole}
		is.Equal(expectedToken, token)
	})

	t.Run("valid x-api-key header succeeds api-key lookup", func(t *testing.T) {
		rawAPIKey, apiKey, err := apiKeyService.GenerateApiKey(*user, "test")
		is.NoError(err)
		defer apiKeyService.DeleteAPIKey(apiKey.ID)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Add("x-api-key", rawAPIKey)

		token, err := bouncer.apiKeyLookup(req)

		expectedToken := &portainer.TokenData{ID: user.ID, Username: user.Username, Role: portainer.StandardUserRole}
		is.Equal(expectedToken, token)
	})

	t.Run("successful api-key lookup updates token last used time", func(t *testing.T) {
		rawAPIKey, apiKey, err := apiKeyService.GenerateApiKey(*user, "test")
		is.NoError(err)
		defer apiKeyService.DeleteAPIKey(apiKey.ID)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Add("x-api-key", rawAPIKey)

		token, err := bouncer.apiKeyLookup(req)

		expectedToken := &portainer.TokenData{ID: user.ID, Username: user.Username, Role: portainer.StandardUserRole}
		is.Equal(expectedToken, token)

		_, apiKeyUpdated, err := apiKeyService.GetDigestUserAndKey(apiKey.Digest)
		is.NoError(err)

		is.True(apiKeyUpdated.LastUsed > apiKey.LastUsed)
	})
}

func Test_ShouldSkipCSRFCheck(t *testing.T) {
	tt := []struct {
		name                     string
		cookieValue              string
		apiKey                   string
		authHeader               string
		isDockerDesktopExtension bool
		expectedResult           bool
		expectedError            bool
	}{
		{
			name:                     "Should return false (not skip) when cookie is present",
			cookieValue:              "test-cookie",
			isDockerDesktopExtension: false,
		},
		{
			name:                     "Should return true (skip) when cookie is present and docker desktop extension is true",
			cookieValue:              "test-cookie",
			isDockerDesktopExtension: true,
			expectedResult:           true,
		},
		{
			name:                     "Should return true (skip) when cookie is not present",
			cookieValue:              "",
			isDockerDesktopExtension: false,
			expectedResult:           true,
		},
		{
			name:                     "Should return true (skip) when api key is present",
			cookieValue:              "",
			apiKey:                   "test-api-key",
			isDockerDesktopExtension: false,
			expectedResult:           true,
		},
		{
			name:                     "Should return true (skip) when auth header is present",
			cookieValue:              "",
			authHeader:               "test-auth-header",
			isDockerDesktopExtension: false,
			expectedResult:           true,
		},
		{
			name:                     "Should return false (not skip) and error when both api key and auth header are present",
			cookieValue:              "",
			apiKey:                   "test-api-key",
			authHeader:               "test-auth-header",
			isDockerDesktopExtension: false,
			expectedError:            true,
		},
	}

	for _, test := range tt {
		t.Run(test.name, func(t *testing.T) {
			is := assert.New(t)
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if test.cookieValue != "" {
				req.AddCookie(&http.Cookie{Name: portainer.AuthCookieKey, Value: test.cookieValue})
			}
			if test.apiKey != "" {
				req.Header.Set(apiKeyHeader, test.apiKey)
			}
			if test.authHeader != "" {
				req.Header.Set(jwtTokenHeader, test.authHeader)
			}

			result, err := ShouldSkipCSRFCheck(req, test.isDockerDesktopExtension)
			is.Equal(test.expectedResult, result)
			if test.expectedError {
				is.Error(err)
			} else {
				is.NoError(err)
			}
		})
	}
}

func TestJWTRevocation(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	err = store.User().Create(&portainer.User{ID: 1})
	require.NoError(t, err)

	jwtService.SetUserSessionDuration(time.Second)

	token, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: 1})
	require.NoError(t, err)

	settings, err := store.Settings().Settings()
	require.NoError(t, err)

	settings.KubeconfigExpiry = "0"

	err = store.Settings().UpdateSettings(settings)
	require.NoError(t, err)

	kubeToken, err := jwtService.GenerateTokenForKubeconfig(&portainer.TokenData{ID: 1})
	require.NoError(t, err)

	apiKeyService := apikey.NewAPIKeyService(nil, nil)

	bouncer := NewRequestBouncer(store, jwtService, apiKeyService)

	r, err := http.NewRequest(http.MethodGet, "url", nil)
	require.NoError(t, err)

	r.Header.Add(jwtTokenHeader, "Bearer "+token)

	r.AddCookie(&http.Cookie{Name: portainer.AuthCookieKey, Value: token})

	_, err = bouncer.JWTAuthLookup(r)
	require.NoError(t, err)

	_, err = bouncer.CookieAuthLookup(r)
	require.NoError(t, err)

	bouncer.RevokeJWT(token)
	bouncer.RevokeJWT(kubeToken)

	revokeLen := func() (l int) {
		bouncer.revokedJWT.Range(func(key, value any) bool {
			l++

			return true
		})

		return l
	}
	require.Equal(t, 2, revokeLen())

	_, err = bouncer.JWTAuthLookup(r)
	require.Error(t, err)

	_, err = bouncer.CookieAuthLookup(r)
	require.Error(t, err)

	time.Sleep(time.Second)

	bouncer.cleanUpExpiredJWTPass()

	require.Equal(t, 1, revokeLen())
}
