package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestGetDeployment(t *testing.T) {
	t.Parallel()

	t.Run("returns the full pod template and resourceVersion", func(t *testing.T) {
		t.Parallel()
		replicas := int32(3)
		deployment := &appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name:            "my-deploy",
				Namespace:       "default",
				ResourceVersion: "12345",
			},
			Spec: appsv1.DeploymentSpec{
				Replicas: &replicas,
				Template: corev1.PodTemplateSpec{
					Spec: corev1.PodSpec{
						Containers: []corev1.Container{
							{Name: "app", Image: "nginx:1.27", Env: []corev1.EnvVar{{Name: "FOO", Value: "bar"}}},
						},
						Volumes: []corev1.Volume{
							{Name: "data", VolumeSource: corev1.VolumeSource{
								PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{ClaimName: "data-pvc"},
							}},
						},
					},
				},
			},
		}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(deployment)}

		result, err := kcl.GetDeployment("default", "my-deploy")
		require.NoError(t, err)
		assert.Equal(t, "12345", result.ResourceVersion)
		require.NotNil(t, result.Spec.Replicas)
		assert.Equal(t, int32(3), *result.Spec.Replicas)
		require.Len(t, result.Spec.Template.Spec.Containers, 1)
		assert.Equal(t, "nginx:1.27", result.Spec.Template.Spec.Containers[0].Image)
		require.Len(t, result.Spec.Template.Spec.Containers[0].Env, 1)
		require.Len(t, result.Spec.Template.Spec.Volumes, 1)
		assert.Equal(t, "data-pvc", result.Spec.Template.Spec.Volumes[0].PersistentVolumeClaim.ClaimName)
	})

	t.Run("trims managed fields and last-applied annotation, preserves status and sets kind", func(t *testing.T) {
		t.Parallel()
		deployment := &appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "my-deploy",
				Namespace: "default",
				ManagedFields: []metav1.ManagedFieldsEntry{
					{Manager: "kubectl", Operation: metav1.ManagedFieldsOperationApply},
				},
				Annotations: map[string]string{
					lastAppliedConfigAnnotation:         `{"huge":"manifest"}`,
					"deployment.kubernetes.io/revision": "4",
				},
			},
			Status: appsv1.DeploymentStatus{Replicas: 3, ReadyReplicas: 3},
		}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(deployment)}

		result, err := kcl.GetDeployment("default", "my-deploy")
		require.NoError(t, err)
		assert.Empty(t, result.ManagedFields, "managed fields should be stripped")
		assert.Equal(t, appsv1.DeploymentStatus{Replicas: 3, ReadyReplicas: 3}, result.Status, "status should be preserved")
		assert.Equal(t, "Deployment", result.Kind, "TypeMeta kind should be set")
		_, hasLastApplied := result.Annotations[lastAppliedConfigAnnotation]
		assert.False(t, hasLastApplied, "last-applied annotation should be stripped")
		assert.Equal(t, "4", result.Annotations["deployment.kubernetes.io/revision"], "other annotations are preserved")
	})

	t.Run("returns not-found error for a missing deployment", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset()}

		_, err := kcl.GetDeployment("default", "does-not-exist")
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not-found error, got: %v", err)
	})
}

func TestGetDeployments(t *testing.T) {
	t.Parallel()

	newDeploy := func(name, namespace string, labels map[string]string) *appsv1.Deployment {
		return &appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace, Labels: labels},
			Status:     appsv1.DeploymentStatus{ReadyReplicas: 1},
		}
	}

	t.Run("admin lists all deployments, sets kind and preserves status", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newDeploy("web", "default", map[string]string{"managed-by": "portainer-run"}),
			newDeploy("db", "default", nil),
		)}
		kcl.SetIsKubeAdmin(true)

		deployments, err := kcl.GetDeployments("default", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, deployments, 2)
		assert.Equal(t, "Deployment", deployments[0].Kind)
		assert.Equal(t, int32(1), deployments[0].Status.ReadyReplicas, "status is preserved")
	})

	t.Run("labelSelector narrows results", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newDeploy("web", "default", map[string]string{"managed-by": "portainer-run"}),
			newDeploy("db", "default", map[string]string{"managed-by": "other"}),
		)}
		kcl.SetIsKubeAdmin(true)

		deployments, err := kcl.GetDeployments("default", models.K8sResourceListOptions{LabelSelector: "managed-by=portainer-run"})
		require.NoError(t, err)
		require.Len(t, deployments, 1)
		assert.Equal(t, "web", deployments[0].Name)
	})
}
