package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"strconv"
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
	"github.com/stretchr/testify/require"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	k8stesting "k8s.io/client-go/testing"
)

const kubeTestEndpointID portainer.EndpointID = 1

// Callers seed the proxy-client cache via seedProxyKubeClient to control which
// fake Kubernetes client a request resolves to.
func newPodTestHandler(t *testing.T) (*Handler, *kubeclient.ClientFactory, *portainer.User, string) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, true)

	// KubernetesLocalEnvironment avoids the nil signatureService panic that
	// AgentOnKubernetesEnvironment triggers via buildAgentConfig.
	err := store.Endpoint().Create(&portainer.Endpoint{
		ID:   kubeTestEndpointID,
		Type: portainer.KubernetesLocalEnvironment,
	})
	require.NoError(t, err)

	u := &portainer.User{Username: "admin", Role: portainer.AdministratorRole}
	err = store.User().Create(u)
	require.NoError(t, err)

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err)

	tk, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	require.NoError(t, err)

	factory, err := kubeclient.NewClientFactory(nil, nil, store, "test", "", "")
	require.NoError(t, err)

	kubeClusterAccessService := kubernetes.NewKubeClusterAccessService("", "", "")
	authorizationService := authorization.NewService(store)
	handler := NewHandler(testhelpers.NewTestRequestBouncer(), authorizationService, store, jwtService, kubeClusterAccessService, factory, testhelpers.NewKubernetesClient())

	return handler, factory, u, tk
}

func newNonAdminUser(t *testing.T, handler *Handler, username string) (*portainer.User, string) {
	t.Helper()

	u := &portainer.User{ID: 2, Username: username, Role: portainer.StandardUserRole}
	require.NoError(t, handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(u)
	}))

	jwtService, err := jwt.NewService("1h", handler.DataStore)
	require.NoError(t, err)

	tk, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	require.NoError(t, err)

	return u, tk
}

// The security context must be explicit: the test request bouncer otherwise
// auto-injects an admin one, making every request behave as admin.
func newPodRequest(t *testing.T, method, path string, u *portainer.User, tk string) *http.Request {
	t.Helper()

	req := httptest.NewRequest(method, path, nil)
	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	req = req.WithContext(ctx)
	ctx = security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		IsAdmin: u.Role == portainer.AdministratorRole,
		UserID:  u.ID,
	})
	req = req.WithContext(ctx)
	testhelpers.AddTestSecurityCookie(req, tk)
	return req
}

// Writes the "<endpointID>.<userID>" key that getProxyKubeClient reads.
func seedProxyKubeClient(factory *kubeclient.ClientFactory, userID portainer.UserID, kcl *kubeclient.KubeClient) {
	factory.SetProxyKubeClient(strconv.Itoa(int(kubeTestEndpointID)), strconv.Itoa(int(userID)), kcl)
}

// Fake clientsets perform no RBAC of their own, so this stands in for a
// cluster denying the verb.
func forbiddenReactor(resource string) k8stesting.ReactionFunc {
	return func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, k8serrors.NewForbidden(schema.GroupResource{Resource: resource}, "", nil)
	}
}
