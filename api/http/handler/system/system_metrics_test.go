package system

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_systemMetrics(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	adminUser := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	err := store.User().Create(adminUser)
	require.NoError(t, err)

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	requestBouncer := security.NewRequestBouncer(t.Context(), store, jwtService, apiKeyService)

	h := NewHandler(requestBouncer, &portainer.Status{}, store, nil, nil)

	token, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: adminUser.ID, Username: adminUser.Username, Role: adminUser.Role})

	t.Run("returns 200 with all metric fields", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/system/metrics", nil)
		testhelpers.AddTestSecurityCookie(req, token)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		require.NoError(t, err)

		var resp systemMetricsResponse
		err = json.Unmarshal(body, &resp)
		require.NoError(t, err, "response should be valid JSON")

		assert.GreaterOrEqual(t, resp.CPU, 0.0)
		assert.LessOrEqual(t, resp.CPU, 100.0)
		assert.Greater(t, resp.CPUCores, 0)
		assert.GreaterOrEqual(t, resp.RAM, 0.0)
		assert.LessOrEqual(t, resp.RAM, 100.0)
		assert.GreaterOrEqual(t, resp.RAMTotal, uint64(0))
		assert.GreaterOrEqual(t, resp.RAMUsed, uint64(0))
		assert.GreaterOrEqual(t, resp.Disk, 0.0)
		assert.LessOrEqual(t, resp.Disk, 100.0)
		assert.GreaterOrEqual(t, resp.DiskTotal, uint64(0))
		assert.GreaterOrEqual(t, resp.DiskUsed, uint64(0))
	})

	t.Run("returns 401 without authentication", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/system/metrics", nil)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
	})
}
