package csrf

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

var okHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

func TestWithProtect_invalidTrustedOriginReturnsError(t *testing.T) {
	t.Parallel()

	_, err := WithProtect(okHandler, []string{"not-a-valid-origin"})
	require.Error(t, err)
}

func TestWithProtect_safeMethodsAlwaysAllowed(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	for _, method := range []string{http.MethodGet, http.MethodHead, http.MethodOptions} {
		req := httptest.NewRequest(method, "/", nil)
		req.Header.Set("Sec-Fetch-Site", "cross-site")

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		require.Equal(t, http.StatusOK, rr.Code, "method %s should be allowed", method)
	}
}

func TestWithProtect_allowsPostWithNoOriginHeaders(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Code)
}

func TestWithProtect_allowsPostWithSameOriginSecFetchSite(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set("Sec-Fetch-Site", "same-origin")

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Code)
}

func TestWithProtect_allowsPostWithNoneSecFetchSite(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set("Sec-Fetch-Site", "none")

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Code)
}

func TestWithProtect_blocksCrossSiteSecFetchSite(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	req.AddCookie(&http.Cookie{Name: portainer.AuthCookieKey, Value: "some-token"})

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusForbidden, rr.Code)
}

func TestWithProtect_blocksSameSiteSecFetchSite(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set("Sec-Fetch-Site", "same-site")
	req.AddCookie(&http.Cookie{Name: portainer.AuthCookieKey, Value: "some-token"})

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusForbidden, rr.Code)
}

func TestWithProtect_allowsPostWithMatchingOriginHeader(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Host = "portainer.example.com"
	req.Header.Set("Origin", "https://portainer.example.com")

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Code)
}

func TestWithProtect_blocksMismatchedOriginHeader(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Host = "portainer.example.com"
	req.Header.Set("Origin", "https://evil.example.com")
	req.AddCookie(&http.Cookie{Name: portainer.AuthCookieKey, Value: "some-token"})

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusForbidden, rr.Code)
}

func TestWithProtect_allowsPostFromTrustedOrigin(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, []string{"https://trusted.example.com"})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Host = "portainer.example.com"
	req.Header.Set("Origin", "https://trusted.example.com")

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusOK, rr.Code)
}

func TestWithProtect_enforcesCsrfForCookieAuth(t *testing.T) {
	t.Parallel()

	handler, err := WithProtect(okHandler, nil)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	req.AddCookie(&http.Cookie{Name: portainer.AuthCookieKey, Value: "some-token"})

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	require.Equal(t, http.StatusForbidden, rr.Code)
}
