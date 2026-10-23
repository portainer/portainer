package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetKubernetesResourceQuotas_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/resource_quotas", u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// A valid request must pass all handler-level checks. Without a live
	// cluster the privileged kube client cannot be created, so we expect 500
	// rather than a 4xx client error.
	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not be rejected at the handler layer")
	assert.NotEqual(t, http.StatusNotFound, rr.Code, "route must be registered")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "without a live cluster the kube client is unavailable")
}

func TestGetKubernetesResourceQuotas_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/resource_quotas", u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}
