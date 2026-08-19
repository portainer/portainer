package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetKubernetesDeployment_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/deployments/my-deploy", u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// A valid request passes all handler-level checks (route registered, request
	// parsed) and reaches the client-resolution step. No proxy client is seeded,
	// so that step fails with 500 rather than a 4xx client error.
	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not be rejected at the handler layer")
	assert.NotEqual(t, http.StatusNotFound, rr.Code, "route must be registered")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "no proxy client is seeded, so client resolution fails")
}

func TestGetKubernetesDeployment_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/deployments/my-deploy", u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestGetAllKubernetesDeployments_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/deployments", u, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not be rejected at the handler layer")
	assert.NotEqual(t, http.StatusNotFound, rr.Code, "route must be registered")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "no proxy client is seeded, so client resolution fails")
}

func TestGetAllKubernetesDeployments_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodPost, "/kubernetes/1/deployments", u, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestGetKubernetesDeploymentsForNamespace_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/deployments", u, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not be rejected at the handler layer")
	assert.NotEqual(t, http.StatusNotFound, rr.Code, "route must be registered")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "no proxy client is seeded, so client resolution fails")
}
