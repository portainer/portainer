package kubernetes

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	kubeclient "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

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

	nonAdmin, tk := newNonAdminUser(t, handler, "readonly")

	clientset := newPodClientset("default", "my-pod")
	clientset.PrependReactor("delete", "pods", forbiddenReactor("pods"))
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

	nonAdmin, tk := newNonAdminUser(t, handler, "operator")

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

func TestGetAllKubernetesPods_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	handler, _, admin, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/pods", admin, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// A valid request must pass all handler-level checks. Without a live
	// cluster the privileged kube client cannot be created, so we expect 500
	// rather than a 4xx client error.
	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not be rejected at the handler layer")
	assert.NotEqual(t, http.StatusNotFound, rr.Code, "route must be registered")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "without a live cluster the kube client is unavailable")
}

func TestGetAllKubernetesPods_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, admin, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodPost, "/kubernetes/1/pods", admin, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestGetKubernetesPodsForNamespace_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	handler, _, admin, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/pods", admin, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not be rejected at the handler layer")
	assert.NotEqual(t, http.StatusNotFound, rr.Code, "route must be registered")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "without a live cluster the kube client is unavailable")
}

func TestGetKubernetesPodsForNamespace_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, admin, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodPut, "/kubernetes/1/namespaces/default/pods", admin, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestGetKubernetesPodLogs_ReachesKubernetesLayer(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/pods/my-pod/log", u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.NotEqual(t, http.StatusBadRequest, rr.Code, "should not be rejected at the handler layer")
	assert.NotEqual(t, http.StatusNotFound, rr.Code, "route must be registered")
	assert.Equal(t, http.StatusInternalServerError, rr.Code, "no proxy client is seeded, so client resolution fails")
}

func TestGetKubernetesPodLogs_InvalidTailLinesReturns400(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodGet, "/kubernetes/1/namespaces/default/pods/my-pod/log?tailLines=abc", u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// A non-numeric tailLines is rejected before any cluster call is attempted.
	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestGetKubernetesPodLogs_WrongMethodReturns404(t *testing.T) {
	t.Parallel()
	handler, _, u, tk := newPodTestHandler(t)

	req := newPodRequest(t, http.MethodPost, "/kubernetes/1/namespaces/default/pods/my-pod/log", u, tk)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

// readerFunc adapts a function to io.Reader so a test can end a stream on its own terms.
type readerFunc func(p []byte) (int, error)

func (f readerFunc) Read(p []byte) (int, error) { return f(p) }

func TestRelayPodLogStream(t *testing.T) {
	t.Parallel()

	t.Run("relays the logs and reports no error when the stream ends", func(t *testing.T) {
		t.Parallel()
		rr := httptest.NewRecorder()

		err := relayPodLogStream(context.Background(), rr, strings.NewReader("line one\nline two\n"))

		require.NoError(t, err)
		assert.Equal(t, "line one\nline two\n", rr.Body.String())
	})

	t.Run("reports the error when the stream is cut short", func(t *testing.T) {
		t.Parallel()
		rr := httptest.NewRecorder()
		streamErr := errors.New("unexpected EOF")
		reads := 0
		stream := readerFunc(func(p []byte) (int, error) {
			reads++
			if reads == 1 {
				return copy(p, "line one\n"), nil
			}
			return 0, streamErr
		})

		err := relayPodLogStream(context.Background(), rr, stream)

		// The logs read so far are still relayed, but the truncation is reported so the
		// caller can tell it apart from a stream that ended on its own.
		require.ErrorIs(t, err, streamErr)
		assert.Equal(t, "line one\n", rr.Body.String())
	})

	t.Run("reports no error when the client goes away mid-stream", func(t *testing.T) {
		t.Parallel()
		rr := httptest.NewRecorder()
		ctx, cancel := context.WithCancel(context.Background())
		stream := readerFunc(func(p []byte) (int, error) {
			cancel()
			return 0, errors.New("context canceled")
		})

		err := relayPodLogStream(ctx, rr, stream)

		assert.NoError(t, err, "a cancelled request is the normal end of a follow stream")
	})
}
