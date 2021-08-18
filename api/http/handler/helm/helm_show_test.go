package helm

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/exec/helm/test"
	helper "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/stretchr/testify/assert"
)

func Test_helmShow(t *testing.T) {
	chartName := "test-nginx"
	is := assert.New(t)

	h := NewTemplateHandler(helper.NewTestRequestBouncer())
	is.NotNil(h, "Handler should not fail")

	defaultSettings := &portainer.Settings{
		HelmRepositoryURL: portainer.DefaultHelmRepositoryURL,
	}
	h.DataStore = helper.NewDatastore(helper.WithSettingsService(defaultSettings))
	h.HelmPackageManager = test.NewMockHelmBinaryPackageManager(kubernetes.NewKubeConfigCAService(""), "")

	commands := map[string]string{
		"values": test.MockDataValues,
		"chart":  test.MockDataChart,
		"readme": test.MockDataReadme,
	}

	for cmd, expect := range commands {
		t.Run(cmd, func(t *testing.T) {
			is := assert.New(t)
			is.NotNil(h, "Handler should not fail")

			req := httptest.NewRequest("GET", fmt.Sprintf("/templates/helm/%s/%s", chartName, cmd), nil)
			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, req)

			is.Equal(rr.Code, http.StatusOK, "Status should be 200 OK")

			body, err := io.ReadAll(rr.Body)
			is.NoError(err, "ReadAll should not return error")
			is.EqualValues(string(body), expect, "Unexpected search response")
		})
	}
}
