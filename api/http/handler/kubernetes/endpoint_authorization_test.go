package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
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

// denyingBouncer satisfies security.BouncerService but rejects AuthorizedEndpointOperation.
type denyingBouncer struct{}

func (denyingBouncer) PublicAccess(h http.Handler) http.Handler         { return h }
func (denyingBouncer) AdminAccess(h http.Handler) http.Handler          { return h }
func (denyingBouncer) RestrictedAccess(h http.Handler) http.Handler     { return h }
func (denyingBouncer) TeamLeaderAccess(h http.Handler) http.Handler     { return h }
func (denyingBouncer) AuthenticatedAccess(h http.Handler) http.Handler  { return h }
func (denyingBouncer) EdgeComputeOperation(h http.Handler) http.Handler { return h }
func (denyingBouncer) AuthorizedEndpointOperation(_ *http.Request, _ *portainer.Endpoint) error {
	return security.ErrAuthorizationRequired
}
func (denyingBouncer) AuthorizedEdgeEndpointOperation(_ *http.Request, _ *portainer.Endpoint) error {
	return nil
}
func (denyingBouncer) CookieAuthLookup(*http.Request) (*portainer.TokenData, error) { return nil, nil }
func (denyingBouncer) JWTAuthLookup(*http.Request) (*portainer.TokenData, error)    { return nil, nil }
func (denyingBouncer) TrustedEdgeEnvironmentAccess(dataservices.DataStoreTx, *portainer.Endpoint) error {
	return nil
}
func (denyingBouncer) RevokeJWT(string) {}
func (denyingBouncer) DisableCSP()      {}

func newEndpointAuthTestHandler(t *testing.T, bouncer security.BouncerService) (*Handler, *portainer.User, string) {
	t.Helper()

	srv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))
	t.Cleanup(srv.Close)

	_, store := datastore.MustNewTestStore(t, true, true)

	err := store.Endpoint().Create(&portainer.Endpoint{
		ID:   1,
		Type: portainer.KubernetesLocalEnvironment,
	})
	require.NoError(t, err)

	u := &portainer.User{Username: "user", Role: portainer.StandardUserRole}
	err = store.User().Create(u)
	require.NoError(t, err)

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	tk, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	require.NoError(t, err)

	kubeClusterAccessService := kubernetes.NewKubeClusterAccessService("", "", "")

	srvURL, err := url.Parse(srv.URL)
	require.NoError(t, err)

	cli := testhelpers.NewKubernetesClient()
	factory, err := kubeclient.NewClientFactory(nil, nil, store, "", ":"+srvURL.Port(), "")
	require.NoError(t, err)

	authorizationService := authorization.NewService(store)
	handler := NewHandler(bouncer, authorizationService, store, jwtService, kubeClusterAccessService, factory, cli)

	return handler, u, tk
}

func newEndpointAuthRequest(t *testing.T, method, path string, u *portainer.User, tk string) *http.Request {
	t.Helper()

	req := httptest.NewRequest(method, path, nil)
	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	req = req.WithContext(ctx)
	ctx = security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{IsAdmin: false, UserID: u.ID})
	req = req.WithContext(ctx)
	testhelpers.AddTestSecurityCookie(req, tk)
	return req
}

func TestEndpointAuthorization_DeniedUser_Returns403(t *testing.T) {
	t.Parallel()

	routes := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/kubernetes/1/namespaces"},
		{http.MethodGet, "/kubernetes/1/configmaps"},
		{http.MethodGet, "/kubernetes/1/services"},
		{http.MethodGet, "/kubernetes/1/secrets"},
		{http.MethodGet, "/kubernetes/1/ingresses"},
	}

	handler, u, tk := newEndpointAuthTestHandler(t, denyingBouncer{})

	for _, route := range routes {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			req := newEndpointAuthRequest(t, route.method, route.path, u, tk)
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			assert.Equal(t, http.StatusForbidden, rr.Code)
		})
	}
}
