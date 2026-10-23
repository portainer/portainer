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
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	kfake "k8s.io/client-go/kubernetes/fake"
)

// seedWorkloadProxyClient registers a fake-backed kube client as the user's proxy
// client, so a write handler acts on a cluster the test can inspect.
func seedWorkloadProxyClient(t *testing.T, factory *kubeclient.ClientFactory, userID portainer.UserID, objects ...runtime.Object) *kfake.Clientset {
	t.Helper()

	clientset := kfake.NewClientset(objects...)
	seedProxyKubeClient(factory, userID, kubeclient.NewTestKubeClient(clientset))

	return clientset
}

// newWorkloadWriteRequest builds an authenticated request carrying a JSON body.
func newWorkloadWriteRequest(t *testing.T, method, path string, body any, u *portainer.User, tk string) *http.Request {
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

func deploymentWritePayload() models.K8sDeploymentWriteRequest {
	replicas := int32(2)
	return models.K8sDeploymentWriteRequest{
		Name:     "web",
		Replicas: &replicas,
		Selector: map[string]string{"app": "web"},
		Pod: &models.K8sPodTemplate{
			Labels:     map[string]string{"app": "web"},
			Containers: []models.K8sContainer{{Name: "app", Image: "nginx:1.27"}},
		},
	}
}

func liveWebDeployment() *appsv1.Deployment {
	replicas := int32(1)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default"},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{MatchLabels: map[string]string{"app": "web"}},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: map[string]string{"app": "web"}},
				Spec:       corev1.PodSpec{Containers: []corev1.Container{{Name: "app", Image: "nginx:1.26"}}},
			},
		},
	}
}

func TestCreateKubernetesDeployment(t *testing.T) {
	t.Parallel()

	t.Run("creates the deployment in the routed namespace", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedWorkloadProxyClient(t, factory, u.ID)

		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/deployments", deploymentWritePayload(), u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, "default", stored.Namespace, "the namespace must come from the route")
		assert.Equal(t, int32(2), *stored.Spec.Replicas)
	})

	t.Run("rejects a payload without a selector", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID)

		payload := deploymentWritePayload()
		payload.Selector = nil
		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/deployments", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("rejects a container without an image", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID)

		payload := deploymentWritePayload()
		payload.Pod.Containers[0].Image = ""
		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/deployments", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("reports a conflict when the deployment already exists", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/deployments", deploymentWritePayload(), u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusConflict, rr.Code)
	})
}

func TestUpdateKubernetesDeployment(t *testing.T) {
	t.Parallel()

	t.Run("updates the deployment named in the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		req := newWorkloadWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/deployments/web", deploymentWritePayload(), u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, "nginx:1.27", stored.Spec.Template.Spec.Containers[0].Image)
	})

	t.Run("rejects a payload naming a different deployment than the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		payload := deploymentWritePayload()
		payload.Name = "other"
		req := newWorkloadWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/deployments/web", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("reports not found when the deployment does not exist", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID)

		req := newWorkloadWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/deployments/web", deploymentWritePayload(), u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}

func TestScaleKubernetesDeployment(t *testing.T) {
	t.Parallel()

	t.Run("scales the deployment", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		replicas := int32(0)
		payload := models.K8sDeploymentScaleRequest{Replicas: &replicas}
		req := newWorkloadWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/deployments/web/scale", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, int32(0), *stored.Spec.Replicas, "scaling to zero must be honoured")
	})

	t.Run("rejects a payload without a replica count", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		req := newWorkloadWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/deployments/web/scale", models.K8sDeploymentScaleRequest{}, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("rejects a negative replica count", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		replicas := int32(-1)
		payload := models.K8sDeploymentScaleRequest{Replicas: &replicas}
		req := newWorkloadWriteRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/deployments/web/scale", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestPatchKubernetesDeployment(t *testing.T) {
	t.Parallel()

	t.Run("applies the annotations", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		payload := models.K8sDeploymentPatchRequest{
			PodAnnotations: map[string]string{"kubectl.kubernetes.io/restartedAt": "2026-08-05T00:00:00Z"},
		}
		req := newWorkloadWriteRequest(t, http.MethodPatch, "/kubernetes/1/namespaces/default/deployments/web", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, "2026-08-05T00:00:00Z", stored.Spec.Template.Annotations["kubectl.kubernetes.io/restartedAt"])
	})

	t.Run("rejects a payload with no annotation to apply", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		req := newWorkloadWriteRequest(t, http.MethodPatch, "/kubernetes/1/namespaces/default/deployments/web", models.K8sDeploymentPatchRequest{}, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestRollbackKubernetesDeployment(t *testing.T) {
	t.Parallel()

	t.Run("reports 404 when the requested revision is not in the history", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		payload := models.K8sDeploymentRollbackRequest{Revision: 3}
		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/deployments/web/rollback", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code, "a missing rollout target is not a server failure")
	})

	t.Run("rejects a negative revision", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		payload := models.K8sDeploymentRollbackRequest{Revision: -1}
		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/deployments/web/rollback", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

func TestDeleteKubernetesDeployment(t *testing.T) {
	t.Parallel()

	t.Run("deletes the deployment named in the route", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedWorkloadProxyClient(t, factory, u.ID, liveWebDeployment())

		req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/deployments/web", u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusNoContent, rr.Code, rr.Body.String())
		_, err := clientset.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		assert.Error(t, err, "the deployment should be gone")
	})

	t.Run("reports not found when the deployment does not exist", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID)

		req := newPodRequest(t, http.MethodDelete, "/kubernetes/1/namespaces/default/deployments/web", u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}

func TestCreateKubernetesPersistentVolumeClaim(t *testing.T) {
	t.Parallel()

	t.Run("creates the claim in the routed namespace", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		clientset := seedWorkloadProxyClient(t, factory, u.ID)

		payload := models.K8sPersistentVolumeClaimCreateRequest{Name: "web-data", Storage: "1Gi"}
		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/persistent_volume_claims", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
		stored, err := clientset.CoreV1().PersistentVolumeClaims("default").Get(t.Context(), "web-data", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, "default", stored.Namespace, "the namespace must come from the route")
	})

	t.Run("rejects a payload without a storage size", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID)

		payload := models.K8sPersistentVolumeClaimCreateRequest{Name: "web-data"}
		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/persistent_volume_claims", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("rejects a storage size that is not a quantity", func(t *testing.T) {
		t.Parallel()
		handler, factory, u, tk := newPodTestHandler(t)
		seedWorkloadProxyClient(t, factory, u.ID)

		payload := models.K8sPersistentVolumeClaimCreateRequest{Name: "web-data", Storage: "1 gigabyte"}
		req := newWorkloadWriteRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/persistent_volume_claims", payload, u, tk)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code, "an unparsable quantity is a payload fault, not a cluster one")
	})
}
