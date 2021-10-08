package helm

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/libhelm/binary/test"
	"github.com/portainer/libhelm/options"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/exec/exectest"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/stretchr/testify/assert"

	"github.com/portainer/portainer/api/bolt"
	helper "github.com/portainer/portainer/api/internal/testhelpers"
)

func Test_helmDelete(t *testing.T) {
	is := assert.New(t)

	store, teardown := bolt.MustNewTestStore(true)
	defer teardown()

	err := store.Endpoint().CreateEndpoint(&portainer.Endpoint{ID: 1})
	is.NoError(err, "Error creating environment")

	err = store.User().CreateUser(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	is.NoError(err, "Error creating a user")

	kubernetesDeployer := exectest.NewKubernetesDeployer()
	helmPackageManager := test.NewMockHelmBinaryPackageManager("")
	kubeConfigService := kubernetes.NewKubeConfigCAService("", "")
	h := NewHandler(helper.NewTestRequestBouncer(), store, kubernetesDeployer, helmPackageManager, kubeConfigService)

	is.NotNil(h, "Handler should not fail")

	// Install a single chart directly, to be deleted by the handler
	options := options.InstallOptions{Name: "nginx-1", Chart: "nginx", Namespace: "default"}
	h.helmPackageManager.Install(options)

	t.Run("helmDelete succeeds with admin user", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/1/kubernetes/helm/%s", options.Name), nil)
		ctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: 1})
		req = req.WithContext(ctx)
		req.Header.Add("Authorization", "Bearer dummytoken")

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusNoContent, rr.Code, "Status should be 204")
	})
}
