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

func TestCreateSecret(t *testing.T) {
	t.Parallel()

	t.Run("defaults the type to Opaque and passes data through as string data", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		created, err := k.CreateSecret("default", models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name:        "app-secrets",
				Data:        map[string]string{"token": "s3cr3t"},
				Labels:      map[string]string{"managed-by": "portainer-run"},
				Annotations: map[string]string{"note": "created by a test"},
			},
		})
		require.NoError(t, err)
		assert.Equal(t, "app-secrets", created.Name)
		assert.Equal(t, string(corev1.SecretTypeOpaque), created.SecretType)
		assert.Empty(t, created.Data, "the response must not echo the data back")

		stored, err := k.cli.CoreV1().Secrets("default").Get(t.Context(), "app-secrets", metav1.GetOptions{})
		require.NoError(t, err)
		// StringData is what a real API server encodes into Data; the fake client stores
		// it verbatim, so asserting on it is asserting the plain value was not encoded twice.
		assert.Equal(t, map[string]string{"token": "s3cr3t"}, stored.StringData)
		assert.Equal(t, map[string]string{"managed-by": "portainer-run"}, stored.Labels)
		assert.Equal(t, map[string]string{"note": "created by a test"}, stored.Annotations)
	})

	t.Run("honours an explicit secret type", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		created, err := k.CreateSecret("default", models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "registry"},
			SecretType:                   string(corev1.SecretTypeDockerConfigJson),
		})
		require.NoError(t, err)
		assert.Equal(t, string(corev1.SecretTypeDockerConfigJson), created.SecretType)
	})

	t.Run("reports a conflict when the secret already exists", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{Name: "app-secrets", Namespace: "default"},
		}))

		_, err := k.CreateSecret("default", models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "app-secrets"},
		})
		require.Error(t, err)
		assert.True(t, k8serrors.IsAlreadyExists(err), "expected an already exists error, got %v", err)
	})
}

func TestUpdateSecret(t *testing.T) {
	t.Parallel()

	liveSecret := func() *corev1.Secret {
		return &corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{
				Name:        "app-secrets",
				Namespace:   "default",
				Labels:      map[string]string{"managed-by": "portainer-run"},
				Annotations: map[string]string{"note": "keep me"},
			},
			Type: corev1.SecretTypeDockerConfigJson,
			Data: map[string][]byte{"stale": []byte("value")},
		}
	}

	t.Run("replaces the data wholesale and preserves the immutable type", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(liveSecret()))

		_, err := k.UpdateSecret("default", models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name: "app-secrets",
				Data: map[string]string{"token": "new"},
			},
			// A type the payload cannot change, so it must be ignored.
			SecretType: string(corev1.SecretTypeOpaque),
		})
		require.NoError(t, err)

		stored, err := k.cli.CoreV1().Secrets("default").Get(t.Context(), "app-secrets", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, stored.Data, "existing data must be dropped so string data replaces rather than merges")
		assert.Equal(t, map[string]string{"token": "new"}, stored.StringData)
		assert.Equal(t, corev1.SecretTypeDockerConfigJson, stored.Type, "the live type must survive the update")
	})

	t.Run("leaves labels and annotations untouched when the payload omits them", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(liveSecret()))

		_, err := k.UpdateSecret("default", models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "app-secrets"},
		})
		require.NoError(t, err)

		stored, err := k.cli.CoreV1().Secrets("default").Get(t.Context(), "app-secrets", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, map[string]string{"managed-by": "portainer-run"}, stored.Labels)
		assert.Equal(t, map[string]string{"note": "keep me"}, stored.Annotations)
		assert.Equal(t, map[string][]byte{"stale": []byte("value")}, stored.Data, "omitted data must be left alone")
	})

	t.Run("clears labels when the payload sends an empty map", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(liveSecret()))

		_, err := k.UpdateSecret("default", models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{
				Name:   "app-secrets",
				Labels: map[string]string{},
			},
		})
		require.NoError(t, err)

		stored, err := k.cli.CoreV1().Secrets("default").Get(t.Context(), "app-secrets", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, stored.Labels)
	})

	t.Run("reports not found when the secret does not exist", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		_, err := k.UpdateSecret("default", models.K8sSecretWriteRequest{
			K8sConfigurationWriteRequest: models.K8sConfigurationWriteRequest{Name: "missing"},
		})
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not found error, got %v", err)
	})
}

func TestDeleteSecret(t *testing.T) {
	t.Parallel()

	t.Run("deletes the secret", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&corev1.Secret{
			ObjectMeta: metav1.ObjectMeta{Name: "app-secrets", Namespace: "default"},
		}))

		require.NoError(t, k.DeleteSecret("default", "app-secrets"))

		_, err := k.cli.CoreV1().Secrets("default").Get(t.Context(), "app-secrets", metav1.GetOptions{})
		assert.True(t, k8serrors.IsNotFound(err), "the secret should be gone, got %v", err)
	})

	t.Run("reports not found when the secret does not exist", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		err := k.DeleteSecret("default", "missing")
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not found error, got %v", err)
	})
}
