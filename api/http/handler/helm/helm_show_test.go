package helm

import (
	"fmt"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/stretchr/testify/assert"

	helm "github.com/portainer/portainer/api/exec/helm"
	i "github.com/portainer/portainer/api/internal/testhelpers"
)

func Test_helmShow(t *testing.T) {

	chartName := "test-nginx"

	h := NewTemplateHandler(nil)
	assert.NotNil(t, h, "Handler should not fail")

	defaultSettings := &portainer.Settings{
		HelmRepositoryURL: portainer.DefaultHelmRepositoryURL,
	}
	h.DataStore = i.NewDatastore(i.WithSettingsService(defaultSettings))
	h.HelmPackageManager = helm.NewMockHelmBinaryPackageManager(kubernetes.NewKubeConfigCAService(""), "")

	path := fmt.Sprintf("/api/templates/helm/%s/values", chartName)

	commands := map[string]string{
		"values": helm.MockDataValues,
		"chart":  helm.MockDataChart,
		"readme": helm.MockDataReadme,
	}

	for cmd, expect := range commands {
		t.Run(cmd, func(t *testing.T) {
			is := assert.New(t)

			r := httptest.NewRequest("GET", path, nil)
			w := httptest.NewRecorder()
			// unfortunately mux.vars() is empty at this point. So we have to insert the path vars manually for testing
			r = mux.SetURLVars(r, map[string]string{
				"chart":   chartName,
				"command": cmd,
			})

			herr := h.helmShow(w, r)
			if herr != nil {
				is.NoError(herr.Err, "Should not return an error")
			}

			response := w.Result()
			body, err := io.ReadAll(response.Body)
			is.NoError(err, "ReadAll should not return error")
			is.EqualValues(string(body), expect, "Unexpected search response")
		})
	}
}
