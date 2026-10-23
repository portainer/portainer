package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetKubernetesIngressClasses_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/ingressclasses", u, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not be rejected at the handler layer")
	assert.NotEqual(t, http.StatusNotFound, rr.Code, "route must be registered")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "no proxy client is seeded, so client resolution fails")
}

func TestGetKubernetesIngressClasses_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodPost, "/kubernetes/1/ingressclasses", u, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}
