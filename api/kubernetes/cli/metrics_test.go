package cli

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func metricsKubeClient(t *testing.T, statusCode int, body string) *KubeClient {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(statusCode)
		_, _ = fmt.Fprint(w, body)
	}))
	t.Cleanup(server.Close)
	cli, err := kubernetes.NewForConfig(&rest.Config{Host: server.URL})
	require.NoError(t, err)
	return &KubeClient{cli: cli}
}

func TestFeatureGateEnabled(t *testing.T) {
	t.Parallel()

	t.Run("returns true when feature gate is enabled", func(t *testing.T) {
		t.Parallel()
		kcl := metricsKubeClient(t, http.StatusOK,
			"kubernetes_feature_enabled{name=\"TestGate\",stage=\"ALPHA\"} 1\n")
		ok, err := kcl.featureGateEnabled(t.Context(), "TestGate")
		require.NoError(t, err)
		assert.True(t, ok)
	})

	t.Run("returns true when labels are in different order", func(t *testing.T) {
		t.Parallel()
		kcl := metricsKubeClient(t, http.StatusOK,
			"kubernetes_feature_enabled{stage=\"ALPHA\",name=\"TestGate\"} 1\n")
		ok, err := kcl.featureGateEnabled(t.Context(), "TestGate")
		require.NoError(t, err)
		assert.True(t, ok)
	})

	t.Run("returns false when feature gate is disabled", func(t *testing.T) {
		t.Parallel()
		kcl := metricsKubeClient(t, http.StatusOK,
			"kubernetes_feature_enabled{name=\"TestGate\",stage=\"ALPHA\"} 0\n")
		ok, err := kcl.featureGateEnabled(t.Context(), "TestGate")
		require.NoError(t, err)
		assert.False(t, ok)
	})

	t.Run("returns false when feature gate is absent", func(t *testing.T) {
		t.Parallel()
		kcl := metricsKubeClient(t, http.StatusOK,
			"kubernetes_feature_enabled{name=\"OtherGate\",stage=\"ALPHA\"} 1\n")
		ok, err := kcl.featureGateEnabled(t.Context(), "TestGate")
		require.NoError(t, err)
		assert.False(t, ok)
	})

	t.Run("returns error when metrics endpoint is unavailable", func(t *testing.T) {
		t.Parallel()
		kcl := metricsKubeClient(t, http.StatusForbidden, "")
		ok, err := kcl.featureGateEnabled(t.Context(), "TestGate")
		require.Error(t, err)
		assert.False(t, ok)
	})
}

func TestSupportsPodRestart(t *testing.T) {
	t.Parallel()

	t.Run("returns true when feature gate is enabled", func(t *testing.T) {
		t.Parallel()
		kcl := metricsKubeClient(t, http.StatusOK,
			"kubernetes_feature_enabled{name=\"RestartAllContainersOnContainerExits\",stage=\"ALPHA\"} 1\n")
		ok, err := kcl.SupportsPodRestart(t.Context())
		require.NoError(t, err)
		assert.True(t, ok)
	})

	t.Run("returns false when feature gate is absent", func(t *testing.T) {
		t.Parallel()
		kcl := metricsKubeClient(t, http.StatusOK,
			"kubernetes_feature_enabled{name=\"OtherFeature\",stage=\"ALPHA\"} 1\n")
		ok, err := kcl.SupportsPodRestart(t.Context())
		require.NoError(t, err)
		assert.False(t, ok)
	})
}
