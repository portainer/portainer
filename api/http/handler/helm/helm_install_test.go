package helm

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/api/datastore"

	"github.com/portainer/libhelm/binary/test"
	"github.com/portainer/libhelm/options"
	"github.com/portainer/libhelm/release"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/exec/exectest"
	"github.com/portainer/portainer/api/http/security"
	helper "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/stretchr/testify/assert"
)

func Test_helmInstall(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	err := store.Endpoint().Create(&portainer.Endpoint{ID: 1})
	is.NoError(err, "error creating environment")

	err = store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	is.NoError(err, "error creating a user")

	jwtService, err := jwt.NewService("1h", store)
	is.NoError(err, "Error initiating jwt service")

	kubernetesDeployer := exectest.NewKubernetesDeployer()
	helmPackageManager := test.NewMockHelmBinaryPackageManager("")
	kubeClusterAccessService := kubernetes.NewKubeClusterAccessService("", "", "")
	h := NewHandler(helper.NewTestRequestBouncer(), store, jwtService, kubernetesDeployer, helmPackageManager, kubeClusterAccessService)

	is.NotNil(h, "Handler should not fail")

	// Install a single chart.  We expect to get these values back
	options := options.InstallOptions{Name: "nginx-1", Chart: "nginx", Namespace: "default", Repo: "https://charts.bitnami.com/bitnami"}
	optdata, err := json.Marshal(options)
	is.NoError(err)

	t.Run("helmInstall succeeds with admin user", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/1/kubernetes/helm", bytes.NewBuffer(optdata))
		ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
		req = req.WithContext(ctx)
		req.Header.Add("Authorization", "Bearer dummytoken")

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusCreated, rr.Code, "Status should be 201")

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		resp := release.Release{}
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be json")
		is.EqualValues(options.Name, resp.Name, "Name doesn't match")
		is.EqualValues(options.Namespace, resp.Namespace, "Namespace doesn't match")
	})
}
