package helm

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/exec/exectest"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	helmtest "github.com/portainer/portainer/pkg/libhelm/test"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestHelmHandler(t *testing.T) *Handler {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, true)

	err := store.Endpoint().Create(&portainer.Endpoint{ID: 1})
	require.NoError(t, err)

	err = store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	require.NoError(t, err)

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	kubernetesDeployer := exectest.NewKubernetesDeployer()
	helmPackageManager := helmtest.NewMockHelmPackageManager()
	kubeClusterAccessService := kubernetes.NewKubeClusterAccessService("", "", "")

	return NewHandler(testhelpers.NewTestRequestBouncer(), store, jwtService, kubernetesDeployer, helmPackageManager, kubeClusterAccessService)
}

func Test_helmInstall(t *testing.T) {
	is := assert.New(t)
	h := newTestHelmHandler(t)

	// Install a single chart.  We expect to get these values back
	options := options.InstallOptions{Name: "nginx-1", Chart: "nginx", Namespace: "default", Repo: "https://charts.bitnami.com/bitnami"}
	optdata, err := json.Marshal(options)
	require.NoError(t, err)

	t.Run("helmInstall succeeds with admin user", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/1/kubernetes/helm", bytes.NewBuffer(optdata))
		ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
		req = req.WithContext(ctx)
		testhelpers.AddTestSecurityCookie(req, "Bearer dummytoken")

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusCreated, rr.Code, "Status should be 201")

		body, err := io.ReadAll(rr.Body)
		require.NoError(t, err, "ReadAll should not return error")

		resp := release.Release{}
		err = json.Unmarshal(body, &resp)
		require.NoError(t, err, "response should be json")
		is.Equal(options.Name, resp.Name, "Name doesn't match")
		is.Equal(options.Namespace, resp.Namespace, "Namespace doesn't match")
	})
}
