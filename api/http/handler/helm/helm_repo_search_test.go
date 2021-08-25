package helm

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/libhelm/binary/test"
	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"

	helper "github.com/portainer/portainer/api/internal/testhelpers"
)

func Test_helmRepoSearch(t *testing.T) {
	is := assert.New(t)

	defaultSettings := &portainer.Settings{
		HelmRepositoryURL: portainer.DefaultHelmRepositoryURL,
	}
	store := helper.NewDatastore(helper.WithSettingsService(defaultSettings))
	helmPackageManager := test.NewMockHelmBinaryPackageManager("")
	h := NewTemplateHandler(helper.NewTestRequestBouncer(), store, helmPackageManager)

	assert.NotNil(t, h, "Handler should not fail")

	t.Run("helmRepoSearch", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/templates/helm", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(rr.Code, http.StatusOK, "Status should be 200 OK")

		_, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")
	})
}
