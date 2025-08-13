package file_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/api/http/handler/file"
	"github.com/stretchr/testify/require"
)

func TestNormalServe(t *testing.T) {
	handler := file.NewHandler("", false, func() bool { return false })
	require.NotNil(t, handler)

	request := func(path string) (*http.Request, *httptest.ResponseRecorder) {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, path, nil)
		handler.ServeHTTP(rr, req)
		return req, rr
	}

	_, rr := request("/timeout.html")
	require.Equal(t, http.StatusTemporaryRedirect, rr.Result().StatusCode)
	loc, err := rr.Result().Location()
	require.NoError(t, err)
	require.NotNil(t, loc)
	require.Equal(t, "/", loc.Path)

	_, rr = request("/")
	require.Equal(t, http.StatusOK, rr.Result().StatusCode)
}

func TestPermissionsPolicyHeader(t *testing.T) {
	handler := file.NewHandler("", false, func() bool { return false })
	require.NotNil(t, handler)

	test := func(path string, exist bool) {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, path, nil)
		handler.ServeHTTP(rr, req)

		require.Equal(t, exist, rr.Result().Header.Get("Permissions-Policy") != "")
	}

	test("/", true)
	test("/index.html", true)
	test("/api", false)
	test("/an/image.png", false)
}

func TestRedirectInstanceDisabled(t *testing.T) {
	handler := file.NewHandler("", false, func() bool { return true })
	require.NotNil(t, handler)

	test := func(path string) {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, path, nil)
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusTemporaryRedirect, rr.Result().StatusCode)
		loc, err := rr.Result().Location()
		require.NoError(t, err)
		require.NotNil(t, loc)
		require.Equal(t, "/timeout.html", loc.Path)
	}

	test("/")
	test("/index.html")
}
