package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/stretchr/testify/require"
)

type mockBouncer struct {
	security.BouncerService
}

func NewMockBouncer() *mockBouncer {
	return &mockBouncer{BouncerService: testhelpers.NewTestRequestBouncer()}
}

func (*mockBouncer) CookieAuthLookup(r *http.Request) (*portainer.TokenData, error) {
	return &portainer.TokenData{
		ID:       1,
		Username: "testuser",
		Token:    "valid-token",
	}, nil
}

func TestLogout(t *testing.T) {
	t.Parallel()
	h := NewHandler(NewMockBouncer(), nil, nil, nil)
	h.KubernetesTokenCacheManager = kubernetes.NewTokenCacheManager()
	_, h.DataStore = datastore.MustNewTestStore(t, true, false)
	k, err := cli.NewClientFactory(nil, nil, nil, "", "", "")
	require.NoError(t, err)
	h.KubernetesClientFactory = k

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/logout", nil)

	h.ServeHTTP(rr, req)
	require.Equal(t, http.StatusNoContent, rr.Code)
}

func TestLogoutNoPanic(t *testing.T) {
	t.Parallel()
	h := NewHandler(testhelpers.NewTestRequestBouncer(), nil, nil, nil)
	_, h.DataStore = datastore.MustNewTestStore(t, true, false)

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/auth/logout", nil)

	h.ServeHTTP(rr, req)
	require.Equal(t, http.StatusNoContent, rr.Code)
}

func TestLogout_ClearsCookie(t *testing.T) {
	tests := []struct {
		name               string
		forceSecureCookies bool
		wantSecure         bool
	}{
		{name: "clears cookie without secure flag", forceSecureCookies: false, wantSecure: false},
		{name: "clears cookie with secure flag when ForceSecureCookies is set", forceSecureCookies: true, wantSecure: true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			h := NewHandler(NewMockBouncer(), nil, nil, nil)
			h.KubernetesTokenCacheManager = kubernetes.NewTokenCacheManager()
			_, h.DataStore = datastore.MustNewTestStore(t, true, false)
			k, err := cli.NewClientFactory(nil, nil, nil, "", "", "")
			require.NoError(t, err)
			h.KubernetesClientFactory = k

			err = h.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
				return tx.Settings().UpdateSettings(&portainer.Settings{ForceSecureCookies: tc.forceSecureCookies})
			})
			require.NoError(t, err)

			rr := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/auth/logout", nil)

			h.ServeHTTP(rr, req)
			require.Equal(t, http.StatusNoContent, rr.Code)

			cookies := rr.Result().Cookies()
			var authCookie *http.Cookie
			for _, c := range cookies {
				if c.Name == portainer.AuthCookieKey {
					authCookie = c
					break
				}
			}
			require.NotNil(t, authCookie, "expected auth cookie to be present in response so the browser can clear it")
			require.Empty(t, authCookie.Value)
			require.Equal(t, -1, authCookie.MaxAge)
			require.Equal(t, tc.wantSecure, authCookie.Secure)
		})
	}
}
