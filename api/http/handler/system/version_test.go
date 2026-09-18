package system

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/pkg/featureflags"
	libclient "github.com/portainer/portainer/pkg/libhttp/client"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_getSystemVersion(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create version data
	version := &models.Version{SchemaVersion: "2.20.0", Edition: 1}
	err := store.Version().UpdateVersion(version)
	require.NoError(t, err, "error creating version data")

	// create admin and standard user(s)
	adminUser := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	err = store.User().Create(adminUser)
	require.NoError(t, err, "error creating admin user")

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err, "Error initiating jwt service")

	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	requestBouncer := security.NewRequestBouncer(t.Context(), store, jwtService, apiKeyService)

	h := NewHandler(requestBouncer, &portainer.Status{}, store, nil, nil)

	// generate standard and admin user tokens
	jwt, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: adminUser.ID, Username: adminUser.Username, Role: adminUser.Role})

	t.Run("Display Edition", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/system/version", nil)
		testhelpers.AddTestSecurityCookie(req, jwt)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		require.NoError(t, err, "ReadAll should not return error")

		var resp versionResponse
		err = json.Unmarshal(body, &resp)
		require.NoError(t, err, "response should be list json")

		is.Equal("CE", resp.ServerEdition, "Edition is not expected")
	})
}

func Test_HasNewerVersion(t *testing.T) {
	t.Parallel()

	f := func(current, latest string, want bool) {
		t.Helper()
		require.Equal(t, want, HasNewerVersion(current, latest))
	}

	// latest version is newer than current
	f("2.19.0", "2.20.0", true)

	// current version is newer than latest
	f("2.20.0", "2.19.0", false)

	// current and latest versions are equal
	f("2.20.0", "2.20.0", false)

	// current version isn't a valid semver
	f("not-a-version", "2.20.0", false)

	// latest version isn't a valid semver
	f("2.20.0", "not-a-version", false)

	// latest version hasn't been fetched yet
	f("2.20.0", "", false)
}

func Test_GetLatestVersion(t *testing.T) {
	// no version cached yet
	cachedLatestVersion.Store(nil)
	require.Empty(t, GetLatestVersion())

	// a version has been cached
	version := "2.21.0"
	cachedLatestVersion.Store(&version)
	require.Equal(t, version, GetLatestVersion())
}

func Test_refreshLatestVersion(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := w.Write([]byte(`{"tag_name":"2.21.0"}`))
		assert.NoError(t, err)
	}))
	defer server.Close()

	// a successful fetch caches the tag name
	cachedLatestVersion.Store(nil)
	refreshLatestVersion(server.URL)
	require.Equal(t, "2.21.0", GetLatestVersion())

	errServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer errServer.Close()

	// a non-200 response leaves the cache untouched
	refreshLatestVersion(errServer.URL)
	require.Equal(t, "2.21.0", GetLatestVersion())

	badJSONServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := w.Write([]byte(`not-json`))
		assert.NoError(t, err)
	}))
	defer badJSONServer.Close()

	// an invalid JSON body leaves the cache untouched
	refreshLatestVersion(badJSONServer.URL)
	require.Equal(t, "2.21.0", GetLatestVersion())

	// an unreachable URL leaves the cache untouched
	refreshLatestVersion("http://127.0.0.1:0")
	require.Equal(t, "2.21.0", GetLatestVersion())

	featureflags.Parse([]string{libclient.DisableExternalRequests}, []featureflags.Feature{libclient.DisableExternalRequests})

	// external requests being disabled leaves the cache untouched
	refreshLatestVersion(server.URL)
	require.Equal(t, "2.21.0", GetLatestVersion())

	featureflags.Parse(nil, []featureflags.Feature{libclient.DisableExternalRequests})
}

func Test_StartVersionCheckService(t *testing.T) {
	featureflags.Parse([]string{libclient.DisableExternalRequests}, []featureflags.Feature{libclient.DisableExternalRequests})

	// external requests being disabled means no fetch is ever started
	cachedLatestVersion.Store(nil)
	ctx, cancel := context.WithCancel(t.Context())
	StartVersionCheckService(ctx, "http://127.0.0.1:1")
	cancel()

	require.Empty(t, GetLatestVersion())

	featureflags.Parse(nil, []featureflags.Feature{libclient.DisableExternalRequests})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := w.Write([]byte(`{"tag_name":"2.22.0"}`))
		assert.NoError(t, err)
	}))
	defer server.Close()

	// an immediate fetch is started as soon as external requests are allowed
	cachedLatestVersion.Store(nil)
	ctx, cancel = context.WithCancel(t.Context())
	defer cancel()

	StartVersionCheckService(ctx, server.URL)

	require.Eventually(t, func() bool {
		return GetLatestVersion() == "2.22.0"
	}, time.Second, 10*time.Millisecond)
}
