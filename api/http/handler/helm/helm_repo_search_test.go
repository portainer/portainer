package helm

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/stretchr/testify/assert"

	helm "github.com/portainer/portainer/api/exec/helm"
	i "github.com/portainer/portainer/api/internal/testhelpers"
)

func Test_helmRepoSearch(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/api/templates/helm", nil)
	w := httptest.NewRecorder()

	h := NewTemplateHandler(nil)
	assert.NotNil(t, h, "Handler should not fail")

	defaultSettings := &portainer.Settings{
		HelmRepositoryURL: portainer.DefaultHelmRepositoryURL,
	}

	h.DataStore = i.NewDatastore(i.WithSettingsService(defaultSettings))
	h.HelmPackageManager = helm.NewMockHelmBinaryPackageManager(kubernetes.NewKubeConfigCAService(""), "")

	t.Run("helmRepoSearch", func(t *testing.T) {
		// fmt.Println("Now do repo search")
		is := assert.New(t)
		herr := h.helmRepoSearch(w, r)
		if herr != nil {
			t.Fail()
		}

		response := w.Result()
		body, err := io.ReadAll(response.Body)
		is.NoError(err, "ReadAll should not return error")
		is.EqualValues(string(body), helm.MockDataIndex, "Unexpected search response")
	})
}
