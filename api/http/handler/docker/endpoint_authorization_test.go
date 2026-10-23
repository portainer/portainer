package docker

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	dockerdomain "github.com/portainer/portainer/api/docker"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// unreachableDockerURL points the test environment at a port that refuses connections, so an
// authorized caller fails fast when the handler builds a docker client rather than blocking on a
// real daemon. The authorization middleware runs before this, which is what these tests assert.
const unreachableDockerURL = "tcp://127.0.0.1:1"

func newDashboardAuthTestHandler(t *testing.T) (*Handler, *jwt.Service, *datastore.Store) {
	t.Helper()
	fips.InitFIPS(false)

	_, store := datastore.MustNewTestStore(t, true, true)

	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
		ID: 1, Name: "docker-env", Type: portainer.DockerEnvironment, URL: unreachableDockerURL,
	}))

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	bouncer := security.NewRequestBouncer(t.Context(), store, jwtService, apikey.NewAPIKeyService(nil, nil))

	factory := dockerclient.NewClientFactory(nil, nil)
	authorizationService := authorization.NewService(store)
	containerService := dockerdomain.NewContainerService(factory, store)

	handler := NewHandler(bouncer, authorizationService, store, factory, containerService)

	return handler, jwtService, store
}

func dashboardRequest(t *testing.T, handler *Handler, jwtService *jwt.Service, user *portainer.User) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(http.MethodGet, "/docker/1/dashboard", nil)
	tk, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: user.ID, Username: user.Username, Role: user.Role})
	require.NoError(t, err)
	testhelpers.AddTestSecurityCookie(req, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	return rr
}

// TestEndpointAuthorization_DeniedUser_Returns403 verifies that the docker /dashboard
// route rejects users with no access policy for the target environment (R8S-1057).
func TestEndpointAuthorization_DeniedUser_Returns403(t *testing.T) {
	handler, jwtService, store := newDashboardAuthTestHandler(t)

	noAccessUser := &portainer.User{
		Username:                "no-access",
		Role:                    portainer.StandardUserRole,
		PortainerAuthorizations: authorization.DefaultPortainerAuthorizations(),
	}
	require.NoError(t, store.User().Create(noAccessUser))

	// A standard user with no access policy must be rejected before the dashboard handler
	// builds a docker client for the environment.
	rr := dashboardRequest(t, handler, jwtService, noAccessUser)

	assert.Equal(t, http.StatusForbidden, rr.Code)
}

// TestEndpointAuthorization_AuthorizedUser_NotForbidden verifies that the docker /dashboard
// route lets an authorized caller through the authorization middleware (R8S-1057). The request
// fails later when the handler cannot reach the docker daemon, but it must not be rejected with 403.
func TestEndpointAuthorization_AuthorizedUser_NotForbidden(t *testing.T) {
	handler, jwtService, store := newDashboardAuthTestHandler(t)

	adminUser := &portainer.User{Username: "admin", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(adminUser))

	rr := dashboardRequest(t, handler, jwtService, adminUser)

	assert.NotEqual(t, http.StatusForbidden, rr.Code)
}
