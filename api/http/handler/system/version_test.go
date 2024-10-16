package system

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
)

func TestHasNewerVersion(t *testing.T) {
	// Test cases
	tests := []struct {
		name           string
		currentVersion string
		latestVersion  string
		expected       bool
	}{
		{
			name:           "current version is less than latest version",
			currentVersion: "2.22.0",
			latestVersion:  "v2.22.1",
			expected:       true,
		},
		{
			name:           "current version is equal to latest version",
			currentVersion: "2.22.0",
			latestVersion:  "v2.22.0",
			expected:       false,
		},
		{
			name:           "current version is greater than latest version",
			currentVersion: "v2.22.2",
			latestVersion:  "v2.22.1",
			expected:       false,
		},
		{
			name:           "invalid current version",
			currentVersion: "invalid",
			latestVersion:  "v2.22.0",
			expected:       false,
		},
		{
			name:           "invalid latest version",
			currentVersion: "2.22.0",
			latestVersion:  "invalid",
			expected:       false,
		},
		{
			name:           "both versions are invalid",
			currentVersion: "invalid",
			latestVersion:  "invalid",
			expected:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := HasNewerVersion(tt.currentVersion, tt.latestVersion)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func Test_getSystemVersion(t *testing.T) {
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create version data
	version := &models.Version{SchemaVersion: "2.20.0", Edition: 1}
	err := store.Version().UpdateVersion(version)
	is.NoError(err, "error creating version data")

	// create admin and standard user(s)
	adminUser := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	err = store.User().Create(adminUser)
	is.NoError(err, "error creating admin user")

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	is.NoError(err, "Error initiating jwt service")
	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	requestBouncer := security.NewRequestBouncer(store, jwtService, apiKeyService)

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
		is.NoError(err, "ReadAll should not return error")

		var resp versionResponse
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Equal("CE", resp.ServerEdition, "Edition is not expected")
	})
}
