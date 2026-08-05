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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	kfake "k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"
)

const podTestEndpointID portainer.EndpointID = 1

// newPodTestHandler builds a Handler backed by a real ClientFactory and an
// admin user/token. Callers seed the factory's proxy-client cache themselves
// (via factory.SetProxyKubeClient) to control which fake Kubernetes client a
// given request resolves to.
func newPodTestHandler(t *testing.T) (*Handler, *kubeclient.ClientFactory, *portainer.User, string) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, true)

	// KubernetesLocalEnvironment avoids the nil signatureService panic that
	// AgentOnKubernetesEnvironment triggers via buildAgentConfig.
	err := store.Endpoint().Create(&portainer.Endpoint{
		ID:   podTestEndpointID,
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

// newPodRequest builds a request carrying explicit token/security context for
// the given user, matching how a real authenticated (non-admin capable)
// request looks. Without this, the test request bouncer auto-injects an
// admin context, which would make every request behave as admin regardless
// of which client the handler resolves.
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

// seedProxyKubeClient registers kcl as the cached proxy client for the given
// user, at the same cache key getProxyKubeClient reads
// (endpointID + "." + userID). This is the client the fixed handler is
// expected to use.
func seedProxyKubeClient(factory *kubeclient.ClientFactory, userID portainer.UserID, kcl *kubeclient.KubeClient) {
	factory.SetProxyKubeClient(strconv.Itoa(int(podTestEndpointID)), strconv.Itoa(int(userID)), kcl)
}

// forbiddenPodReactor makes the reacted-on verb against pods fail as though
// the caller's Kubernetes RBAC denies it - simulating what a real cluster
// would do for a non-admin user whose role doesn't grant that verb. fake
// clientsets perform no RBAC of their own, so this reactor stands in for it.
func forbiddenPodReactor(action k8stesting.Action) (bool, runtime.Object, error) {
	return true, nil, k8serrors.NewForbidden(corev1.Resource("pods"), "", nil)
}

func newPodClientset(namespace, name string) *kfake.Clientset {
	return kfake.NewSimpleClientset(&corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
	})
}

// --- deleteKubernetesPod ---

func TestDeleteKubernetesPod_AdminAllVerbsAllowed(t *testing.T) {
	t.Parallel()
	handler, factory, admin, tk := newPodTestHandler(t)

	kcl := kubeclient.NewTestKubeClient(newPodClientset("default", "my-pod"))
	seedProxyKubeClient(factory, admin.ID, kcl)

	req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/pods/my-pod", admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNoContent, rr.Code)
}

func TestDeleteKubernetesPod_NonAdminReadOnlyVerbDenied(t *testing.T) {
	t.Parallel()
	handler, factory, _, _ := newPodTestHandler(t)

	nonAdmin := &portainer.User{ID: 2, Username: "readonly", Role: portainer.StandardUserRole}
	require.NoError(t, handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(nonAdmin)
	}))

	jwtService, err := jwt.NewService("1h", handler.DataStore)
	require.NoError(t, err)
	tk, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: nonAdmin.ID, Username: nonAdmin.Username, Role: nonAdmin.Role})
	require.NoError(t, err)

	clientset := newPodClientset("default", "my-pod")
	clientset.PrependReactor("delete", "pods", forbiddenPodReactor)
	kcl := kubeclient.NewTestKubeClient(clientset)
	kcl.SetIsKubeAdmin(false)
	seedProxyKubeClient(factory, nonAdmin.ID, kcl)

	req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/pods/my-pod", nonAdmin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusForbidden, rr.Code)
}

func TestDeleteKubernetesPod_NonAdminWriteVerbGranted(t *testing.T) {
	t.Parallel()
	handler, factory, _, _ := newPodTestHandler(t)

	nonAdmin := &portainer.User{ID: 2, Username: "operator", Role: portainer.StandardUserRole}
	require.NoError(t, handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(nonAdmin)
	}))

	jwtService, err := jwt.NewService("1h", handler.DataStore)
	require.NoError(t, err)
	tk, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: nonAdmin.ID, Username: nonAdmin.Username, Role: nonAdmin.Role})
	require.NoError(t, err)

	kcl := kubeclient.NewTestKubeClient(newPodClientset("default", "my-pod"))
	kcl.SetIsKubeAdmin(false)
	seedProxyKubeClient(factory, nonAdmin.ID, kcl)

	req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/pods/my-pod", nonAdmin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNoContent, rr.Code, "a non-admin whose real RBAC grants delete must still succeed")
}

func TestDeleteKubernetesPod_NotFound(t *testing.T) {
	t.Parallel()
	handler, factory, admin, tk := newPodTestHandler(t)

	kcl := kubeclient.NewTestKubeClient(kfake.NewSimpleClientset())
	seedProxyKubeClient(factory, admin.ID, kcl)

	req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/pods/missing-pod", admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

// TestDeleteKubernetesPod_UsesProxyClientNotPrivileged is the regression test
// for C9S-355: only the proxy client is seeded, so the handler must resolve
// it rather than falling back to a privileged admin client.
func TestDeleteKubernetesPod_UsesProxyClientNotPrivileged(t *testing.T) {
	t.Parallel()
	handler, factory, admin, tk := newPodTestHandler(t)

	kcl := kubeclient.NewTestKubeClient(newPodClientset("default", "my-pod"))
	seedProxyKubeClient(factory, admin.ID, kcl)
	// Deliberately not seeding any privileged-client cache key.

	req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/pods/my-pod", admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNoContent, rr.Code, "handler must resolve the proxy client, not a privileged one")
}

// TestDeleteKubernetesPod_MissingProxyClientFails is the inverse of the
// above: with no proxy client cached at all, the handler must fail rather
// than falling back to some other client.
func TestDeleteKubernetesPod_MissingProxyClientFails(t *testing.T) {
	t.Parallel()
	handler, _, admin, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/pods/my-pod", admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
}

func TestDeleteKubernetesPod_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, admin, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/pods/my-pod", admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

// --- restartKubernetesPod ---
//
// RestartPod issues a raw RESTClient() call, which panics against the fake
// clientset used elsewhere in this file, so verb-level RBAC denial isn't
// exercised here. Both tests below only cover paths that return before
// RestartPod is reached.

func TestRestartKubernetesPod_MissingProxyClientFails(t *testing.T) {
	t.Parallel()
	handler, _, admin, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/pods/my-pod/restart", admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
}

func TestRestartKubernetesPod_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, admin, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/pods/my-pod/restart", admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}
