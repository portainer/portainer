package helm

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/libhelm/binary/test"
	portainer "github.com/portainer/portainer/api"
	helper "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_helmShow(t *testing.T) {
	is := assert.New(t)

	defaultSettings := &portainer.Settings{
		HelmRepositoryURL: portainer.DefaultHelmRepositoryURL,
	}
	store := helper.NewDatastore(helper.WithSettingsService(defaultSettings))
	helmPackageManager := test.NewMockHelmBinaryPackageManager("")
	h := NewTemplateHandler(helper.NewTestRequestBouncer(), store, helmPackageManager)

	is.NotNil(h, "Handler should not fail")

	commands := map[string]string{
		"values": test.MockDataValues,
		"chart":  test.MockDataChart,
		"readme": test.MockDataReadme,
	}

	chartName := "test-nginx"
	for cmd, expect := range commands {
		t.Run(cmd, func(t *testing.T) {
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
