package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestCreateConfigMap(t *testing.T) {
	t.Parallel()

	t.Run("creates the config map with its data, labels and annotations", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		created, err := k.CreateConfigMap("default", models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name:        "portainer-run-config",
				Data:        map[string]string{"disabledEnvs": "{}"},
				Labels:      map[string]string{"managed-by": "portainer-run"},
				Annotations: map[string]string{"note": "created by a test"},
			},
		})
		require.NoError(t, err)
		assert.Equal(t, "portainer-run-config", created.Name)
		assert.Empty(t, created.Data, "the response must not echo the data back")

		stored, err := k.cli.CoreV1().ConfigMaps("default").Get(t.Context(), "portainer-run-config", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, map[string]string{"disabledEnvs": "{}"}, stored.Data)
		assert.Equal(t, map[string]string{"managed-by": "portainer-run"}, stored.Labels)
		assert.Equal(t, map[string]string{"note": "created by a test"}, stored.Annotations)
	})

	t.Run("reports a conflict when the config map already exists", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: "portainer-run-config", Namespace: "default"},
		}))

		_, err := k.CreateConfigMap("default", models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "portainer-run-config"},
		})
		require.Error(t, err)
		assert.True(t, k8serrors.IsAlreadyExists(err), "expected an already exists error, got %v", err)
	})
}

func TestUpdateConfigMap(t *testing.T) {
	t.Parallel()

	liveConfigMap := func() *corev1.ConfigMap {
		return &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{
				Name:        "portainer-run-config",
				Namespace:   "default",
				Labels:      map[string]string{"managed-by": "portainer-run"},
				Annotations: map[string]string{"note": "keep me"},
			},
			Data:       map[string]string{"stale": "value"},
			BinaryData: map[string][]byte{"cert.der": {0x01, 0x02}},
		}
	}

	t.Run("replaces the data wholesale and preserves binary data", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(liveConfigMap()))

		_, err := k.UpdateConfigMap("default", models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name: "portainer-run-config",
				Data: map[string]string{"disabledEnvs": `{"3":true}`},
			},
		})
		require.NoError(t, err)

		stored, err := k.cli.CoreV1().ConfigMaps("default").Get(t.Context(), "portainer-run-config", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, map[string]string{"disabledEnvs": `{"3":true}`}, stored.Data)
		assert.Equal(t, map[string][]byte{"cert.der": {0x01, 0x02}}, stored.BinaryData, "unmodelled binary data must survive")
	})

	t.Run("leaves data, labels and annotations untouched when the payload omits them", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(liveConfigMap()))

		_, err := k.UpdateConfigMap("default", models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "portainer-run-config"},
		})
		require.NoError(t, err)

		stored, err := k.cli.CoreV1().ConfigMaps("default").Get(t.Context(), "portainer-run-config", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, map[string]string{"stale": "value"}, stored.Data)
		assert.Equal(t, map[string]string{"managed-by": "portainer-run"}, stored.Labels)
		assert.Equal(t, map[string]string{"note": "keep me"}, stored.Annotations)
	})

	t.Run("clears annotations when the payload sends an empty map", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(liveConfigMap()))

		_, err := k.UpdateConfigMap("default", models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name:        "portainer-run-config",
				Annotations: map[string]string{},
			},
		})
		require.NoError(t, err)

		stored, err := k.cli.CoreV1().ConfigMaps("default").Get(t.Context(), "portainer-run-config", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, stored.Annotations)
	})

	t.Run("reports not found when the config map does not exist", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		_, err := k.UpdateConfigMap("default", models.K8sConfigMapWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "missing"},
		})
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not found error, got %v", err)
	})
}

func TestDeleteConfigMap(t *testing.T) {
	t.Parallel()

	t.Run("deletes the config map", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: "portainer-run-config", Namespace: "default"},
		}))

		require.NoError(t, k.DeleteConfigMap("default", "portainer-run-config"))

		_, err := k.cli.CoreV1().ConfigMaps("default").Get(t.Context(), "portainer-run-config", metav1.GetOptions{})
		assert.True(t, k8serrors.IsNotFound(err), "the config map should be gone, got %v", err)
	})

	t.Run("reports not found when the config map does not exist", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		err := k.DeleteConfigMap("default", "missing")
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not found error, got %v", err)
	})
}
