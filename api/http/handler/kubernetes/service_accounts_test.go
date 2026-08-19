package kubernetes

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/kubernetes"
	kubeclient "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func newServiceAccountTestHandler(t *testing.T) (*Handler, *portainer.User, string) {
	t.Helper()

	srv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))
	t.Cleanup(srv.Close)

	_, store := datastore.MustNewTestStore(t, true, true)

	err := store.Endpoint().Create(&portainer.Endpoint{
		ID:   1,
		Type: portainer.AgentOnKubernetesEnvironment,
	})
	require.NoError(t, err, "error creating environment")

	u := &portainer.User{Username: "admin", Role: portainer.AdministratorRole}
	err = store.User().Create(u)
	require.NoError(t, err, "error creating a user")

	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err, "error initiating jwt service")

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

	return handler, u, tk
}

func newServiceAccountRequest(t *testing.T, method, path string, body []byte, u *portainer.User, tk string) *http.Request {
	t.Helper()

	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, path, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, path, nil)
	}

	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	req = req.WithContext(ctx)
	ctx = security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{IsAdmin: true, UserID: u.ID})
	req = req.WithContext(ctx)
	testhelpers.AddTestSecurityCookie(req, tk)

	return req
}

func TestDeleteKubernetesServiceAccounts_ValidPayload(t *testing.T) {
	t.Parallel()
	handler, u, tk := newServiceAccountTestHandler(t)

	payload := models.K8sServiceAccountDeleteRequests{
		"default": {"sa-1", "sa-2"},
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := newServiceAccountRequest(t, http.MethodPost, "/kubernetes/1/service_accounts/delete", body, u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not return bad request for valid payload")
}

func TestDeleteKubernetesServiceAccounts_InvalidPayload(t *testing.T) {
	t.Parallel()
	handler, u, tk := newServiceAccountTestHandler(t)

	payload := models.K8sServiceAccountDeleteRequests{}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := newServiceAccountRequest(t, http.MethodPost, "/kubernetes/1/service_accounts/delete", body, u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code, "should return bad request for invalid payload")
	bodyData, err := io.ReadAll(rr.Result().Body)
	require.NoError(t, err)
	assert.NotEmpty(t, string(bodyData), "should have error response body")
}

func TestDeleteKubernetesServiceAccounts_EmptyNamespace(t *testing.T) {
	t.Parallel()
	handler, u, tk := newServiceAccountTestHandler(t)

	payload := models.K8sServiceAccountDeleteRequests{
		"": {"sa-1"},
	}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := newServiceAccountRequest(t, http.MethodPost, "/kubernetes/1/service_accounts/delete", body, u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code, "should return bad request for empty namespace")
	bodyData, err := io.ReadAll(rr.Result().Body)
	require.NoError(t, err)
	assert.NotEmpty(t, string(bodyData), "should have error response body")
}

func TestUpdateKubernetesServiceAccountImagePullSecrets_ValidPayload(t *testing.T) {
	t.Parallel()
	handler, u, tk := newServiceAccountTestHandler(t)

	payload := map[string][]string{"secretNames": {"secret-1", "secret-2"}}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := newServiceAccountRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/service_accounts/my-sa/image_pull_secrets", body, u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not return bad request for valid payload")
}

func TestUpdateKubernetesServiceAccountImagePullSecrets_InvalidPayload(t *testing.T) {
	t.Parallel()
	handler, u, tk := newServiceAccountTestHandler(t)

	req := newServiceAccountRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/service_accounts/my-sa/image_pull_secrets", []byte("not-json"), u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code, "should return bad request for malformed JSON")
}

func TestUpdateKubernetesServiceAccountImagePullSecrets_EmptySecretNames(t *testing.T) {
	t.Parallel()
	handler, u, tk := newServiceAccountTestHandler(t)

	payload := map[string][]string{"secretNames": {}}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := newServiceAccountRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/service_accounts/my-sa/image_pull_secrets", body, u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "empty secretNames should be valid (clears all imagePullSecrets)")
}

func TestUpdateKubernetesServiceAccountImagePullSecrets_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	// Verifies that valid JSON passes all handler-level checks and reaches the
	// Kubernetes layer. Without a live cluster the proxy client is unavailable,
	// so we get 500 — not a 4xx client error.
	handler, u, tk := newServiceAccountTestHandler(t)

	payload := map[string][]string{"secretNames": {"secret-1", "secret-2"}}
	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := newServiceAccountRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/service_accounts/my-sa/image_pull_secrets", body, u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "valid payload must not be rejected at the handler layer")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "without a live cluster the proxy client is unavailable")
}

func TestUpdateKubernetesServiceAccountImagePullSecrets_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, u, tk := newServiceAccountTestHandler(t)

	req := newServiceAccountRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/service_accounts/my-sa/image_pull_secrets", nil, u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Gorilla mux returns 404 (not 405) for method mismatches when no MethodNotAllowedHandler is set
	assert.Equal(t, http.StatusNotFound, rr.Code, "unregistered method on this route returns 404")
}

const serviceAccountPath = "/kubernetes/1/namespaces/team-a/service_accounts/build-bot"

func newServiceAccountClientset(namespace, name string) *kfake.Clientset {
	return kfake.NewSimpleClientset(&corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
	})
}

func TestGetKubernetesServiceAccount_ReturnsAccountInNamespace(t *testing.T) {
	t.Parallel()
	handler, factory, admin, tk := newPodTestHandler(t)

	kcl := kubeclient.NewTestKubeClient(newServiceAccountClientset("team-a", "build-bot"))
	seedProxyKubeClient(factory, admin.ID, kcl)

	req := newPodRequest(t, http.MethodGet, serviceAccountPath, admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
}

func TestGetKubernetesServiceAccount_ForbiddenNamespaceDenied(t *testing.T) {
	t.Parallel()
	handler, factory, _, _ := newPodTestHandler(t)

	nonAdmin, tk := newNonAdminUser(t, handler, "tenant-b")

	clientset := newServiceAccountClientset("team-a", "build-bot")
	clientset.PrependReactor("get", "serviceaccounts", forbiddenReactor("serviceaccounts"))
	kcl := kubeclient.NewTestKubeClient(clientset)
	kcl.SetIsKubeAdmin(false)
	kcl.SetClientNonAdminNamespaces([]string{"team-a"})
	seedProxyKubeClient(factory, nonAdmin.ID, kcl)

	req := newPodRequest(t, http.MethodGet, serviceAccountPath, nonAdmin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusForbidden, rr.Code)
}

func TestGetKubernetesServiceAccount_NotFound(t *testing.T) {
	t.Parallel()
	handler, factory, admin, tk := newPodTestHandler(t)

	kcl := kubeclient.NewTestKubeClient(kfake.NewSimpleClientset())
	seedProxyKubeClient(factory, admin.ID, kcl)

	req := newPodRequest(t, http.MethodGet, serviceAccountPath, admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}
