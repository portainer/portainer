package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	kubeclient "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/stretchr/testify/assert"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	kfake "k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"
	"k8s.io/metrics/pkg/apis/metrics/v1beta1"
	metricsfake "k8s.io/metrics/pkg/client/clientset/versioned/fake"
)

// Objects passed to metricsfake.NewSimpleClientset are tracked under a different
// resource name than PodMetricses().List queries, so responses must come from a
// reactor on the "pods" resource of the metrics.k8s.io group.

const podMetricsPath = "/kubernetes/1/metrics/pods/namespace/team-a"

func newPodMetricsClient(reactor k8stesting.ReactionFunc) *kubeclient.KubeClient {
	metricsCli := metricsfake.NewSimpleClientset()
	metricsCli.PrependReactor("list", "pods", reactor)

	return kubeclient.NewTestKubeClientWithMetrics(kfake.NewSimpleClientset(), metricsCli)
}

func podMetricsReactor(namespace string) k8stesting.ReactionFunc {
	return func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, &v1beta1.PodMetricsList{
			Items: []v1beta1.PodMetrics{
				{ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: namespace}},
			},
		}, nil
	}
}

func TestGetKubernetesMetricsForAllPods_ReturnsMetricsForNamespace(t *testing.T) {
	t.Parallel()
	handler, factory, admin, tk := newPodTestHandler(t)

	seedProxyKubeClient(factory, admin.ID, newPodMetricsClient(podMetricsReactor("team-a")))

	req := newPodRequest(t, http.MethodGet, podMetricsPath, admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Contains(t, rr.Body.String(), "web")
}

func TestGetKubernetesMetricsForAllPods_ForbiddenNamespaceDenied(t *testing.T) {
	t.Parallel()
	handler, factory, _, _ := newPodTestHandler(t)

	nonAdmin, tk := newNonAdminUser(t, handler, "tenant-b")

	kcl := newPodMetricsClient(forbiddenReactor("pods"))
	kcl.SetIsKubeAdmin(false)
	kcl.SetClientNonAdminNamespaces([]string{"team-a"})
	seedProxyKubeClient(factory, nonAdmin.ID, kcl)

	req := newPodRequest(t, http.MethodGet, podMetricsPath, nonAdmin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusForbidden, rr.Code)
}

// The upstream status makes a metrics-server outage distinguishable from a
// Portainer fault.
func TestGetKubernetesMetricsForAllPods_ReportsUpstreamStatusOnFailure(t *testing.T) {
	t.Parallel()
	handler, factory, admin, tk := newPodTestHandler(t)

	unavailable := func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, k8serrors.NewServiceUnavailable("metrics server is not ready")
	}
	seedProxyKubeClient(factory, admin.ID, newPodMetricsClient(unavailable))

	req := newPodRequest(t, http.MethodGet, podMetricsPath, admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "upstream status 503")
}

// The generated frontend SDK targets the new path.
func TestGetKubernetesMetricsForAllPods_OldRouteRemoved(t *testing.T) {
	t.Parallel()
	handler, factory, admin, tk := newPodTestHandler(t)

	seedProxyKubeClient(factory, admin.ID, newPodMetricsClient(podMetricsReactor("team-a")))

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/metrics/pods/team-a", admin, tk)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}
