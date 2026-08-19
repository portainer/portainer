package helm

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_helmGet(t *testing.T) {
	is := assert.New(t)
	h := newTestHelmHandler(t)

	// Install a single chart, to be retrieved by the handler
	options := options.InstallOptions{Name: "nginx-1", Chart: "nginx", Namespace: "default"}

	_, err := h.helmPackageManager.Upgrade(options)
	require.NoError(t, err)

	t.Run("helmGet sucessfuly retrieves helm release", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/1/kubernetes/helm/"+options.Name+"?namespace="+options.Namespace, nil)
		ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
		req = req.WithContext(ctx)
		testhelpers.AddTestSecurityCookie(req, "Bearer dummytoken")

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		data := release.Release{}
		body, err := io.ReadAll(rr.Body)
		require.NoError(t, err, "ReadAll should not return error")

		err = json.Unmarshal(body, &data)
		require.NoError(t, err)
		is.Equal(http.StatusOK, rr.Code, "Status should be 200")
		is.Equal("nginx-1", data.Name)
	})
}
