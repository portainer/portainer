package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/kubernetes"
	kubeclient "github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Currently this test just tests the HTTP Handler is setup correctly, in the future we should move the ClientFactory to a mock in order
// test the logic in event.go
func TestGetKubernetesEvents(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	srv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))
	defer srv.Close()

	_, store := datastore.MustNewTestStore(t, true, true)

	err := store.Endpoint().Create(&portainer.Endpoint{ID: 1, Type: portainer.AgentOnKubernetesEnvironment})
	require.NoError(t, err, "error creating environment")

	u := &portainer.User{Username: "admin", Role: portainer.AdministratorRole}
	err = store.User().Create(u)
	require.NoError(t, err, "error creating a user")

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err, "Error initiating jwt service")

	tk, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	require.NoError(t, err)

	kubeClusterAccessService := kubernetes.NewKubeClusterAccessService("", "", "")

	srvURL, err := url.Parse(srv.URL)
	require.NoError(t, err)

	cli := testhelpers.NewKubernetesClient()
	factory, err := kubeclient.NewClientFactory(nil, nil, store, "", ":"+srvURL.Port(), "")
	require.NoError(t, err)

	authorizationService := authorization.NewService(store)
	handler := NewHandler(testhelpers.NewTestRequestBouncer(), authorizationService, store, jwtService, kubeClusterAccessService, factory, cli)
	is.NotNil(handler, "Handler should not fail")

	req := httptest.NewRequest(http.MethodGet, "/kubernetes/1/events?resourceId=8", nil)
	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	req = req.WithContext(ctx)

	ctx = security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: u.ID, IsAdmin: true})
	req = req.WithContext(ctx)

	testhelpers.AddTestSecurityCookie(req, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	is.Equal(http.StatusOK, rr.Code, "Status should be 200")
}
