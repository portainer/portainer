package helm

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/libhelm/binary/test"
	"github.com/portainer/libhelm/options"
	"github.com/portainer/libhelm/release"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/exec/exectest"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/stretchr/testify/assert"

	"github.com/portainer/portainer/api/bolt"
	helper "github.com/portainer/portainer/api/internal/testhelpers"
)

func Test_helmList(t *testing.T) {
	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	err := store.Endpoint().CreateEndpoint(&portainer.Endpoint{ID: 1})
	assert.NoError(t, err, "error creating environment")

	err = store.User().CreateUser(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	assert.NoError(t, err, "error creating a user")

	kubernetesDeployer := exectest.NewKubernetesDeployer()
	helmPackageManager := test.NewMockHelmBinaryPackageManager("")
	kubeConfigService := kubernetes.NewKubeConfigCAService("", "")
	h := NewHandler(helper.NewTestRequestBouncer(), store, kubernetesDeployer, helmPackageManager, kubeConfigService)

	// Install a single chart.  We expect to get these values back
	options := options.InstallOptions{Name: "nginx-1", Chart: "nginx", Namespace: "default"}
	h.helmPackageManager.Install(options)

	t.Run("helmList", func(t *testing.T) {
		is := assert.New(t)

		req := httptest.NewRequest(http.MethodGet, "/1/kubernetes/helm", nil)
		req.Header.Add("Authorization", "Bearer dummytoken")

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code, "Status should be 200 OK")

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		data := []release.ReleaseElement{}
		json.Unmarshal(body, &data)
		if is.Equal(1, len(data), "Expected one chart entry") {
			is.EqualValues(options.Name, data[0].Name, "Name doesn't match")
			is.EqualValues(options.Chart, data[0].Chart, "Chart doesn't match")
		}
	})
}
