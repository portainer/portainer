package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func Test_SetSecretsIsUsed_ServiceAccountImagePullSecret(t *testing.T) {
	t.Parallel()

	k := NewTestKubeClient(kfake.NewClientset())
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "registry-secret",
			Namespace: "default",
		},
		Type: corev1.SecretTypeDockerConfigJson,
	}

	_, err := k.cli.CoreV1().Secrets("default").Create(t.Context(), secret, metav1.CreateOptions{})
	require.NoError(t, err)

	serviceAccount := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "app-sa",
			Namespace: "default",
		},
		ImagePullSecrets: []corev1.LocalObjectReference{
			{Name: "registry-secret"},
		},
	}
	_, err = k.cli.CoreV1().ServiceAccounts("default").Create(t.Context(), serviceAccount, metav1.CreateOptions{})
	require.NoError(t, err)

	secrets := []models.K8sSecret{parseSecret(secret, false)}

	err = k.SetSecretsIsUsed(&secrets)

	require.NoError(t, err)
	assert.True(t, secrets[0].IsUsed)
}

func Test_SetSecretsIsUsed_NotReferencedByAnySA(t *testing.T) {
	t.Parallel()

	k := NewTestKubeClient(kfake.NewClientset())
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "unused-secret",
			Namespace: "default",
		},
		Type: corev1.SecretTypeDockerConfigJson,
	}
	_, err := k.cli.CoreV1().Secrets("default").Create(t.Context(), secret, metav1.CreateOptions{})
	require.NoError(t, err)

	serviceAccount := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "app-sa",
			Namespace: "default",
		},
		ImagePullSecrets: []corev1.LocalObjectReference{
			{Name: "other-secret"},
		},
	}
	_, err = k.cli.CoreV1().ServiceAccounts("default").Create(t.Context(), serviceAccount, metav1.CreateOptions{})
	require.NoError(t, err)

	secrets := []models.K8sSecret{parseSecret(secret, false)}

	err = k.SetSecretsIsUsed(&secrets)

	require.NoError(t, err)
	assert.False(t, secrets[0].IsUsed)
}

func Test_SetSecretsIsUsed_SAInDifferentNamespace(t *testing.T) {
	t.Parallel()

	k := NewTestKubeClient(kfake.NewClientset())
	// Create a secret named "registry-secret" in the default namespace
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "registry-secret",
			Namespace: "default",
		},
		Type: corev1.SecretTypeDockerConfigJson,
	}
	_, err := k.cli.CoreV1().Secrets("default").Create(t.Context(), secret, metav1.CreateOptions{})
	require.NoError(t, err)

	// Create a service account in a different namespace that references a secret with the same name.
	// In Kubernetes, secrets are namespace-scoped, so this SA references a different secret
	// (one that doesn't exist in "other-namespace"), not the one we created in "default".
	serviceAccount := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "app-sa",
			Namespace: "other-namespace",
		},
		ImagePullSecrets: []corev1.LocalObjectReference{
			{Name: "registry-secret"},
		},
	}
	_, err = k.cli.CoreV1().ServiceAccounts("other-namespace").Create(t.Context(), serviceAccount, metav1.CreateOptions{})
	require.NoError(t, err)

	secrets := []models.K8sSecret{parseSecret(secret, false)}

	err = k.SetSecretsIsUsed(&secrets)

	// The secret in the default namespace should not be marked as used,
	// since the SA reference is to a secret in a different namespace.
	require.NoError(t, err)
	assert.False(t, secrets[0].IsUsed)
}

func Test_SetSecretsIsUsed_SAWithEmptyImagePullSecrets(t *testing.T) {
	t.Parallel()

	k := NewTestKubeClient(kfake.NewClientset())
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "registry-secret",
			Namespace: "default",
		},
		Type: corev1.SecretTypeDockerConfigJson,
	}
	_, err := k.cli.CoreV1().Secrets("default").Create(t.Context(), secret, metav1.CreateOptions{})
	require.NoError(t, err)

	serviceAccount := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "app-sa",
			Namespace: "default",
		},
	}
	_, err = k.cli.CoreV1().ServiceAccounts("default").Create(t.Context(), serviceAccount, metav1.CreateOptions{})
	require.NoError(t, err)

	secrets := []models.K8sSecret{parseSecret(secret, false)}

	err = k.SetSecretsIsUsed(&secrets)

	require.NoError(t, err)
	assert.False(t, secrets[0].IsUsed)
}
