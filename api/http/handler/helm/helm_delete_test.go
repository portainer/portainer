package helm

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/pkg/libhelm/options"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_helmDelete(t *testing.T) {
	is := assert.New(t)
	h := newTestHelmHandler(t)

	// Install a single chart directly, to be deleted by the handler
	options := options.InstallOptions{Name: "nginx-1", Chart: "nginx", Namespace: "default"}

	_, err := h.helmPackageManager.Upgrade(options)
	require.NoError(t, err)

	t.Run("helmDelete succeeds with admin user", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/1/kubernetes/helm/"+options.Name, nil)
		ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
		req = req.WithContext(ctx)
		testhelpers.AddTestSecurityCookie(req, "Bearer dummytoken")

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusNoContent, rr.Code, "Status should be 204")
	})
}
