package helm

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/exec/helm/test"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/stretchr/testify/assert"

	helper "github.com/portainer/portainer/api/internal/testhelpers"
)

func Test_helmRepoSearch(t *testing.T) {
	h := NewTemplateHandler(helper.NewTestRequestBouncer())
	assert.NotNil(t, h, "Handler should not fail")

	defaultSettings := &portainer.Settings{
		HelmRepositoryURL: portainer.DefaultHelmRepositoryURL,
	}
	h.DataStore = helper.NewDatastore(helper.WithSettingsService(defaultSettings))
	h.HelmPackageManager = test.NewMockHelmBinaryPackageManager(kubernetes.NewKubeConfigCAService(""), "")

	t.Run("helmRepoSearch", func(t *testing.T) {
		is := assert.New(t)

		req := httptest.NewRequest(http.MethodGet, "/templates/helm", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(rr.Code, http.StatusOK, "Status should be 200 OK")

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")
		is.EqualValues(string(body), test.MockDataIndex, "Unexpected search response")
	})
}
