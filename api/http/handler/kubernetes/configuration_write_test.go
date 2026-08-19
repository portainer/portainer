package kubernetes

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	kubeclient "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	kfake "k8s.io/client-go/kubernetes/fake"
)

// seedConfigurationProxyClient registers a fake-backed kube client as the user's proxy
// client, so a write handler acts on a cluster the test can inspect.
func seedConfigurationProxyClient(t *testing.T, factory *kubeclient.ClientFactory, userID portainer.UserID, objects ...runtime.Object) *kfake.Clientset {
	t.Helper()

	clientset := kfake.NewClientset(objects...)
	seedProxyKubeClient(factory, userID, kubeclient.NewTestKubeClient(clientset))

	return clientset
}

// newConfigurationWriteRequest builds an authenticated request carrying a JSON body.
func newConfigurationWriteRequest(t *testing.T, method, path string, body any, u *portainer.User, tk string) *http.Request {
	t.Helper()

	encoded, err := json.Marshal(body)
	require.NoError(t, err)

	req := httptest.NewRequest(method, path, bytes.NewReader(encoded))
	req.Header.Set("Content-Type", "application/json")
	ctx := security.StoreTokenData(req, &portainer.TokenData{ID: u.ID, Username: u.Username, Role: u.Role})
	req = req.WithContext(ctx)
	ctx = security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{IsAdmin: true, UserID: u.ID})
	req = req.WithContext(ctx)
	testhelpers.AddTestSecurityCookie(req, tk)

	return req
}

func TestCreateKubernetesSecret(t *testing.T) {
	t.Parallel()

	t.Run("creates the secret in the routed namespace", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedConfigurationProxyClient(t, factory, u.ID)

		payload := models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name: "app-secrets",
				Data: map[string]string{"token": "s3cr3t"},
			},
		}
		req := newConfigurationWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/secrets", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.CoreV1().Secrets("default").Get(t.Context(), "app-secrets", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, "default", stored.Namespace, "the namespace must come from the route")
		assert.Equal(t, corev1.SecretTypeOpaque, stored.Type)
	})

	t.Run("rejects a payload without a name", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedConfigurationProxyClient(t, factory, u.ID)

		payload := models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Data: map[string]string{"token": "s3cr3t"}},
		}
		req := newConfigurationWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/secrets", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("reports a conflict when the secret already exists", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedConfigurationProxyClient(t, factory, u.ID, &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{Name: "app-secrets", Namespace: "default"},
		})

		payload := models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "app-secrets"},
		}
		req := newConfigurationWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/secrets", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusConflict, rr.Code)
	})
}

func TestUpdateKubernetesSecret(t *testing.T) {
	t.Parallel()

	t.Run("updates the secret named in the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedConfigurationProxyClient(t, factory, u.ID, &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{Name: "app-secrets", Namespace: "default"},
			Data:       map[string][]byte{"stale": []byte("value")},
		})

		payload := models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name: "app-secrets",
				Data: map[string]string{"token": "new"},
			},
		}
		req := newConfigurationWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/secrets/app-secrets", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.CoreV1().Secrets("default").Get(t.Context(), "app-secrets", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, map[string]string{"token": "new"}, stored.StringData)
	})

	t.Run("rejects a payload naming a different secret than the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedConfigurationProxyClient(t, factory, u.ID, &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{Name: "app-secrets", Namespace: "default"},
		})

		payload := models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "other-secret"},
		}
		req := newConfigurationWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/secrets/app-secrets", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("reports not found when the secret does not exist", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedConfigurationProxyClient(t, factory, u.ID)

		payload := models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "missing"},
		}
		req := newConfigurationWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/secrets/missing", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}

func TestDeleteKubernetesSecret(t *testing.T) {
	t.Parallel()

	t.Run("deletes the secret named in the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedConfigurationProxyClient(t, factory, u.ID, &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{Name: "app-secrets", Namespace: "default"},
		})

		req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/secrets/app-secrets", u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusNoContent, rr.Code, rr.Body.String())
		_, err := clientset.CoreV1().Secrets("default").Get(t.Context(), "app-secrets", metav1.GetOptions{})
		assert.Error(t, err, "the secret should be gone")
	})

	t.Run("reports not found when the secret does not exist", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedConfigurationProxyClient(t, factory, u.ID)

		req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/secrets/missing", u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}

func TestCreateKubernetesConfigMap(t *testing.T) {
	t.Parallel()

	t.Run("creates the config map in the routed namespace", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedConfigurationProxyClient(t, factory, u.ID)

		payload := models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name: "portainer-run-config",
				Data: map[string]string{"disabledEnvs": "{}"},
			},
		}
		req := newConfigurationWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/configmaps", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.CoreV1().ConfigMaps("default").Get(t.Context(), "portainer-run-config", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, map[string]string{"disabledEnvs": "{}"}, stored.Data)
	})

	t.Run("rejects a payload without a name", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedConfigurationProxyClient(t, factory, u.ID)

		payload := models.K8sConfigMapWriteRequest{}
		req := newConfigurationWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/configmaps", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestUpdateKubernetesConfigMap(t *testing.T) {
	t.Parallel()

	t.Run("updates the config map named in the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedConfigurationProxyClient(t, factory, u.ID, &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: "portainer-run-config", Namespace: "default"},
			Data:       map[string]string{"stale": "value"},
		})

		payload := models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name: "portainer-run-config",
				Data: map[string]string{"disabledEnvs": `{"3":true}`},
			},
		}
		req := newConfigurationWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/configmaps/portainer-run-config", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.CoreV1().ConfigMaps("default").Get(t.Context(), "portainer-run-config", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, map[string]string{"disabledEnvs": `{"3":true}`}, stored.Data)
	})

	t.Run("rejects a payload naming a different config map than the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedConfigurationProxyClient(t, factory, u.ID, &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: "portainer-run-config", Namespace: "default"},
		})

		payload := models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "other-config"},
		}
		req := newConfigurationWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/configmaps/portainer-run-config", payload, u, tk)

		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestDeleteKubernetesConfigMap(t *testing.T) {
	t.Parallel()

	t.Run("deletes the config map named in the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedConfigurationProxyClient(t, factory, u.ID, &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: "portainer-run-config", Namespace: "default"},
		})

		req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/configmaps/portainer-run-config", u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusNoContent, rr.Code, rr.Body.String())
		_, err := clientset.CoreV1().ConfigMaps("default").Get(t.Context(), "portainer-run-config", metav1.GetOptions{})
		assert.Error(t, err, "the config map should be gone")
	})

	t.Run("reports not found when the config map does not exist", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedConfigurationProxyClient(t, factory, u.ID)

		req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/configmaps/missing", u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}
