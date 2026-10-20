package security

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"

	gojwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// testHandler200 is a simple handler which returns HTTP status 200 OK
var testHandler200 = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})

func tokenLookupSucceed(dataStore dataservices.DataStore, jwtService portainer.JWTService) tokenLookup {
	return func(r *http.Request) (*portainer.ScopedTokenData, error) {
		uid := portainer.UserID(1)
		if err := dataStore.User().Create(&portainer.User{ID: uid}); err != nil {
			return nil, err
		}

		_, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: uid})

		return &portainer.ScopedTokenData{
			TokenData: &portainer.TokenData{ID: 1},
			Scope:     portainer.DefaultTokenScope,
		}, err
	}
}

func tokenLookupFail(r *http.Request) (*portainer.ScopedTokenData, error) {
	return nil, ErrInvalidKey
}

func tokenLookupEmpty(r *http.Request) (*portainer.ScopedTokenData, error) {
	return nil, nil
}

func Test_mwAuthenticateFirst(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, true)

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err, "failed to create a copy of service")

	apiKeyService := apikey.NewAPIKeyService(nil, nil)

	bouncer := NewRequestBouncer(t.Context(), store, jwtService, apiKeyService)

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

			h := bouncer.mwAuthenticateFirst(tt.verificationMiddlwares, testHandler200, sessionTokenScopes)
			h.ServeHTTP(rr, req)

			is.Equal(tt.wantStatusCode, rr.Code, "Status should be %d", tt.wantStatusCode)
		})
	}
}

func Test_extractKeyFromCookie(t *testing.T) {
	t.Parallel()
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
			require.Error(t, err, "Should return error")
			is.ErrorIs(err, http.ErrNoCookie)
		} else {
			require.NoError(t, err)
		}
	}
}

func Test_extractBearerToken(t *testing.T) {
	t.Parallel()
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
	t.Parallel()
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

func Test_apiKeyLookup(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create standard user
	user := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	err := store.User().Create(user)
	require.NoError(t, err, "error creating user")

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err, "Error initiating jwt service")
	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	bouncer := NewRequestBouncer(t.Context(), store, jwtService, apiKeyService)

	t.Run("missing x-api-key header fails api-key lookup", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		// testhelpers.AddTestSecurityCookie(req, jwt)
		token, err := bouncer.apiKeyLookup(req)
		require.NoError(t, err)
		is.Nil(token)
	})

	t.Run("invalid x-api-key header fails api-key lookup", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Add("x-api-key", "random-failing-api-key")
		token, err := bouncer.apiKeyLookup(req)
		is.Nil(token)
		require.Error(t, err)
	})

	t.Run("valid x-api-key header succeeds api-key lookup", func(t *testing.T) {
		rawAPIKey, _, err := apiKeyService.GenerateApiKey(*user, "test")
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Add("x-api-key", rawAPIKey)

		token, err := bouncer.apiKeyLookup(req)
		require.NoError(t, err)

		expectedToken := &portainer.TokenData{ID: user.ID, Username: user.Username, Role: portainer.StandardUserRole}
		is.Equal(expectedToken, token.TokenData)
	})

	t.Run("valid x-api-key header succeeds api-key lookup", func(t *testing.T) {
		rawAPIKey, apiKey, err := apiKeyService.GenerateApiKey(*user, "test")
		require.NoError(t, err)
		defer func() {
			err := apiKeyService.DeleteAPIKey(apiKey.ID)
			require.NoError(t, err)
		}()

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Add("x-api-key", rawAPIKey)

		token, err := bouncer.apiKeyLookup(req)
		require.NoError(t, err)

		expectedToken := &portainer.TokenData{ID: user.ID, Username: user.Username, Role: portainer.StandardUserRole}
		is.Equal(expectedToken, token.TokenData)
	})

	t.Run("successful api-key lookup updates token last used time", func(t *testing.T) {
		rawAPIKey, apiKey, err := apiKeyService.GenerateApiKey(*user, "test")
		require.NoError(t, err)
		defer func() {
			err := apiKeyService.DeleteAPIKey(apiKey.ID)
			require.NoError(t, err)
		}()

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Add("x-api-key", rawAPIKey)

		token, err := bouncer.apiKeyLookup(req)
		require.NoError(t, err)

		expectedToken := &portainer.TokenData{ID: user.ID, Username: user.Username, Role: portainer.StandardUserRole}
		is.Equal(expectedToken, token.TokenData)

		_, apiKeyUpdated, err := apiKeyService.GetDigestUserAndKey(apiKey.Digest)
		require.NoError(t, err)

		is.Greater(apiKeyUpdated.LastUsed, apiKey.LastUsed)
	})
}

func Test_mwAuthenticateFirst_rejectsBothAPIKeyAndBearerToken(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, true)

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	apiKeyService := apikey.NewAPIKeyService(nil, nil)
	bouncer := NewRequestBouncer(t.Context(), store, jwtService, apiKeyService)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set(apiKeyHeader, "test-api-key")
	req.Header.Set(jwtTokenHeader, "Bearer test-token")

	rr := httptest.NewRecorder()
	h := bouncer.mwAuthenticateFirst(nil, testHandler200, sessionTokenScopes)
	h.ServeHTTP(rr, req)

	require.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestJWTRevocation(t *testing.T) {
	t.Parallel()
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

	kubeToken, err := jwtService.GenerateTokenForKubeconfig(&portainer.TokenData{ID: 1}, 1)
	require.NoError(t, err)

	apiKeyService := apikey.NewAPIKeyService(nil, nil)

	bouncer := NewRequestBouncer(t.Context(), store, jwtService, apiKeyService)

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

func TestCSPHeaderDefault(t *testing.T) {
	t.Parallel()
	b := NewRequestBouncer(t.Context(), nil, nil, nil)

	srv := httptest.NewServer(
		b.PublicAccess(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})),
	)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/")
	require.NoError(t, err)
	defer func() {
		err := resp.Body.Close()
		require.NoError(t, err)
	}()

	require.Contains(t, resp.Header, "Content-Security-Policy")
}

func TestCSPHeaderDisabled(t *testing.T) {
	t.Parallel()
	b := NewRequestBouncer(t.Context(), nil, nil, nil)
	b.DisableCSP()

	srv := httptest.NewServer(
		b.PublicAccess(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})),
	)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/")
	require.NoError(t, err)
	defer func() {
		err := resp.Body.Close()
		require.NoError(t, err)
	}()

	require.NotContains(t, resp.Header, "Content-Security-Policy")
}

const scopeTestUserID = portainer.UserID(1)

type tokenScopeFixture struct {
	bouncer  *RequestBouncer
	store    dataservices.DataStore
	session  string
	endpoint *portainer.Endpoint
}

func setupTokenScopeFixture(t *testing.T) *tokenScopeFixture {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, true)

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	// An administrator, so the binding is exercised on the one role that would
	// otherwise short-circuit every environment check.
	require.NoError(t, store.User().Create(&portainer.User{ID: scopeTestUserID, Role: portainer.AdministratorRole}))

	// A never-expiring kubeconfig token, the shipped default.
	settings, err := store.Settings().Settings()
	require.NoError(t, err)
	settings.KubeconfigExpiry = "0"
	require.NoError(t, store.Settings().UpdateSettings(settings))

	session, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: scopeTestUserID, Role: portainer.AdministratorRole})
	require.NoError(t, err)

	endpoint := &portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}
	require.NoError(t, store.Endpoint().Create(endpoint))

	return &tokenScopeFixture{
		bouncer:  NewRequestBouncer(t.Context(), store, jwtService, apikey.NewAPIKeyService(nil, nil)),
		store:    store,
		session:  session,
		endpoint: endpoint,
	}
}

func (f *tokenScopeFixture) kubeconfigToken(t *testing.T, endpointID portainer.EndpointID) string {
	t.Helper()

	jwtService, err := jwt.NewService("1h", f.store)
	require.NoError(t, err)

	token, err := jwtService.GenerateTokenForKubeconfig(&portainer.TokenData{ID: scopeTestUserID, Role: portainer.AdministratorRole}, endpointID)
	require.NoError(t, err)

	return token
}

// unscopedKubeconfigToken forges a kubeconfig token carrying no environment claim,
// a shape GenerateTokenForKubeconfig refuses to mint.
func (f *tokenScopeFixture) unscopedKubeconfigToken(t *testing.T) string {
	t.Helper()

	var kubeSecret []byte
	require.NoError(t, f.store.ViewTx(func(tx dataservices.DataStoreTx) error {
		settings, err := tx.Settings().Settings()
		if err != nil {
			return err
		}

		kubeSecret = settings.OAuthSettings.KubeSecretKey

		return nil
	}))

	token := gojwt.NewWithClaims(gojwt.SigningMethodHS256, gojwt.MapClaims{
		"id":    scopeTestUserID,
		"role":  portainer.AdministratorRole,
		"scope": portainer.KubeconfigTokenScope,
		"jti":   "unscoped-kubeconfig",
		"iat":   time.Now().Unix(),
	})

	signed, err := token.SignedString(kubeSecret)
	require.NoError(t, err)

	return signed
}

func (f *tokenScopeFixture) serve(t *testing.T, guard func(http.Handler) http.Handler, bearer string) *httptest.ResponseRecorder {
	t.Helper()

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set(jwtTokenHeader, "Bearer "+bearer)

	rr := httptest.NewRecorder()
	guard(testHandler200).ServeHTTP(rr, r)

	return rr
}

func TestTokenScope_KubeconfigTokenIsConfinedToTheKubernetesProxy(t *testing.T) {
	t.Parallel()
	f := setupTokenScopeFixture(t)
	kubeconfig := f.kubeconfigToken(t, f.endpoint.ID)

	t.Run("rejected on a session route", func(t *testing.T) {
		require.Equal(t, http.StatusForbidden, f.serve(t, f.bouncer.AuthenticatedAccess, kubeconfig).Code)
	})

	t.Run("accepted on the kubernetes proxy", func(t *testing.T) {
		require.Equal(t, http.StatusOK, f.serve(t, f.bouncer.AuthenticatedAccessAllowingKubeconfig, kubeconfig).Code)
	})
}

func TestTokenScope_SessionTokenReachesBothRoutes(t *testing.T) {
	t.Parallel()
	f := setupTokenScopeFixture(t)

	require.Equal(t, http.StatusOK, f.serve(t, f.bouncer.AuthenticatedAccess, f.session).Code)
	require.Equal(t, http.StatusOK, f.serve(t, f.bouncer.AuthenticatedAccessAllowingKubeconfig, f.session).Code)
}

func TestTokenScope_EnvironmentBinding(t *testing.T) {
	t.Parallel()
	f := setupTokenScopeFixture(t)

	other := &portainer.Endpoint{ID: 2, Type: portainer.KubernetesLocalEnvironment}
	require.NoError(t, f.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.Endpoint().Create(other)
	}))

	// The environment check runs inside the proxy route, on the stored token data.
	authorize := func(t *testing.T, bearer string, endpoint *portainer.Endpoint) error {
		t.Helper()

		var authErr error
		guard := func(http.Handler) http.Handler {
			return f.bouncer.AuthenticatedAccessAllowingKubeconfig(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				authErr = f.bouncer.AuthorizedEndpointOperation(r, endpoint)
			}))
		}

		require.Equal(t, http.StatusOK, f.serve(t, guard, bearer).Code)

		return authErr
	}

	t.Run("an admin reaches the environment it was issued for", func(t *testing.T) {
		bound := f.kubeconfigToken(t, f.endpoint.ID)
		require.NoError(t, authorize(t, bound, f.endpoint))
	})

	t.Run("an admin does not reach an environment it was not issued for", func(t *testing.T) {
		bound := f.kubeconfigToken(t, f.endpoint.ID)
		require.ErrorIs(t, authorize(t, bound, other), httperrors.ErrEndpointAccessDenied)
	})

	t.Run("a token carrying no environment claim stays unrestricted", func(t *testing.T) {
		legacy := f.unscopedKubeconfigToken(t)
		require.NoError(t, authorize(t, legacy, other))
	})
}
