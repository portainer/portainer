package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func int32Ptr(v int32) *int32 { return new(v) }

// writeRequest builds a payload for a single-container deployment named web.
func writeRequest() models.K8sDeploymentWriteRequest {
	return models.K8sDeploymentWriteRequest{
		Name:     "web",
		Labels:   map[string]string{"app": "web"},
		Replicas: int32Ptr(2),
		Selector: map[string]string{"app": "web"},
		Pod: &models.K8sPodTemplate{
			Labels: map[string]string{"app": "web"},
			Containers: []models.K8sContainer{{
				Name:            "app",
				Image:           "nginx:1.27",
				ImagePullPolicy: string(corev1.PullAlways),
				Command:         []string{"nginx"},
				WorkingDir:      "/app",
				Ports:           []models.K8sContainerPort{{ContainerPort: 8080, Protocol: string(corev1.ProtocolTCP)}},
				Env: []models.K8sEnvVar{
					{Name: "PORT", Value: "8080"},
					{Name: "TOKEN", SecretRef: &models.K8sSecretKeyRef{Name: "app-secrets", Key: "token"}},
				},
				EnvFromSecrets: []string{"shared-secrets"},
				Resources: &models.K8sResourceRequirements{
					Requests: map[string]string{"cpu": "500m", "memory": "256Mi"},
					Limits:   map[string]string{"nvidia.com/gpu": "1"},
				},
				VolumeMounts: []models.K8sVolumeMount{{Name: "data", MountPath: "/data"}},
			}},
			Volumes: []models.K8sPodVolume{{Name: "data", ClaimName: "web-data"}},
		},
	}
}

func TestCreateDeployment(t *testing.T) {
	t.Parallel()

	t.Run("maps every modelled field onto the deployment", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		created, err := k.CreateDeployment("default", writeRequest())
		require.NoError(t, err)
		assert.Equal(t, "Deployment", created.Kind, "write responses carry the kind like the read ones")

		stored, err := k.cli.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, "default", stored.Namespace, "the namespace comes from the caller, not the payload")
		assert.Equal(t, int32(2), *stored.Spec.Replicas)
		assert.Equal(t, map[string]string{"app": "web"}, stored.Spec.Selector.MatchLabels)

		require.Len(t, stored.Spec.Template.Spec.Containers, 1)
		container := stored.Spec.Template.Spec.Containers[0]
		assert.Equal(t, "nginx:1.27", container.Image)
		assert.Equal(t, corev1.PullAlways, container.ImagePullPolicy)
		assert.Equal(t, []string{"nginx"}, container.Command)
		assert.Equal(t, "/app", container.WorkingDir)
		require.Len(t, container.Ports, 1)
		assert.Equal(t, int32(8080), container.Ports[0].ContainerPort)

		require.Len(t, container.Env, 2)
		assert.Equal(t, "8080", container.Env[0].Value)
		require.NotNil(t, container.Env[1].ValueFrom, "a secret reference must become a valueFrom")
		assert.Equal(t, "app-secrets", container.Env[1].ValueFrom.SecretKeyRef.Name)
		assert.Equal(t, "token", container.Env[1].ValueFrom.SecretKeyRef.Key)

		require.Len(t, container.EnvFrom, 1)
		assert.Equal(t, "shared-secrets", container.EnvFrom[0].SecretRef.Name)

		assert.Equal(t, resource.MustParse("500m"), container.Resources.Requests[corev1.ResourceCPU])
		assert.Equal(t, resource.MustParse("256Mi"), container.Resources.Requests[corev1.ResourceMemory])
		assert.Equal(t, resource.MustParse("1"), container.Resources.Limits["nvidia.com/gpu"], "vendor resource keys pass through")

		require.Len(t, container.VolumeMounts, 1)
		assert.Equal(t, "/data", container.VolumeMounts[0].MountPath)
		require.Len(t, stored.Spec.Template.Spec.Volumes, 1)
		require.NotNil(t, stored.Spec.Template.Spec.Volumes[0].PersistentVolumeClaim)
		assert.Equal(t, "web-data", stored.Spec.Template.Spec.Volumes[0].PersistentVolumeClaim.ClaimName)
	})

	t.Run("drops a resource quantity that does not parse rather than failing the create", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		request := writeRequest()
		request.Pod.Containers[0].Resources = &models.K8sResourceRequirements{
			Requests: map[string]string{"cpu": "not-a-quantity", "memory": "256Mi"},
		}

		_, err := k.CreateDeployment("default", request)
		require.NoError(t, err)

		stored, err := k.cli.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		require.NoError(t, err)
		requests := stored.Spec.Template.Spec.Containers[0].Resources.Requests
		assert.NotContains(t, requests, corev1.ResourceCPU)
		assert.Equal(t, resource.MustParse("256Mi"), requests[corev1.ResourceMemory])
	})

	t.Run("reports a conflict when the deployment already exists", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default"},
		}))

		_, err := k.CreateDeployment("default", writeRequest())
		require.Error(t, err)
		assert.True(t, k8serrors.IsAlreadyExists(err), "expected an already exists error, got %v", err)
	})
}

func TestUpdateDeployment(t *testing.T) {
	t.Parallel()

	liveDeployment := func() *appsv1.Deployment {
		return &appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "web",
				Namespace: "default",
				Labels:    map[string]string{"app": "web"},
			},
			Spec: appsv1.DeploymentSpec{
				Replicas: int32Ptr(1),
				Selector: &metav1.LabelSelector{MatchLabels: map[string]string{"app": "web"}},
				// Fields the payload cannot express, which must survive an update.
				Strategy: appsv1.DeploymentStrategy{Type: appsv1.RecreateDeploymentStrategyType},
				Template: corev1.PodTemplateSpec{
					ObjectMeta: metav1.ObjectMeta{Labels: map[string]string{"app": "web"}},
					Spec: corev1.PodSpec{
						ServiceAccountName: "web-sa",
						Tolerations:        []corev1.Toleration{{Key: "dedicated", Operator: corev1.TolerationOpExists}},
						Containers:         []corev1.Container{{Name: "app", Image: "nginx:1.26"}},
					},
				},
			},
		}
	}

	t.Run("replaces the modelled fields and preserves the rest", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(liveDeployment()))

		_, err := k.UpdateDeployment("default", models.K8sDeploymentWriteRequest{
			Name:     "web",
			Replicas: int32Ptr(4),
			Pod: &models.K8sPodTemplate{
				Containers: []models.K8sContainer{{Name: "app", Image: "nginx:1.27"}},
			},
		})
		require.NoError(t, err)

		stored, err := k.cli.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, int32(4), *stored.Spec.Replicas)
		assert.Equal(t, "nginx:1.27", stored.Spec.Template.Spec.Containers[0].Image)

		assert.Equal(t, appsv1.RecreateDeploymentStrategyType, stored.Spec.Strategy.Type, "the update strategy must survive")
		assert.Equal(t, "web-sa", stored.Spec.Template.Spec.ServiceAccountName, "the service account must survive")
		assert.Len(t, stored.Spec.Template.Spec.Tolerations, 1, "tolerations must survive")
		assert.Equal(t, map[string]string{"app": "web"}, stored.Spec.Template.Labels, "omitted pod labels are left alone")
		assert.Equal(t, map[string]string{"app": "web"}, stored.Labels, "omitted labels are left alone")
	})

	t.Run("ignores the selector, which Kubernetes will not let change", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(liveDeployment()))

		_, err := k.UpdateDeployment("default", models.K8sDeploymentWriteRequest{
			Name:     "web",
			Selector: map[string]string{"app": "something-else"},
		})
		require.NoError(t, err)

		stored, err := k.cli.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, map[string]string{"app": "web"}, stored.Spec.Selector.MatchLabels)
	})

	t.Run("reports not found when the deployment does not exist", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		_, err := k.UpdateDeployment("default", models.K8sDeploymentWriteRequest{Name: "missing"})
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not found error, got %v", err)
	})
}

func TestScaleDeployment(t *testing.T) {
	t.Parallel()

	t.Run("sets the replica count", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default"},
			Spec:       appsv1.DeploymentSpec{Replicas: int32Ptr(1)},
		}))

		scaled, err := k.ScaleDeployment("default", "web", 5)
		require.NoError(t, err)
		require.NotNil(t, scaled.Spec.Replicas)
		assert.Equal(t, int32(5), *scaled.Spec.Replicas)
	})

	t.Run("scales down to zero", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default"},
			Spec:       appsv1.DeploymentSpec{Replicas: int32Ptr(3)},
		}))

		scaled, err := k.ScaleDeployment("default", "web", 0)
		require.NoError(t, err)
		require.NotNil(t, scaled.Spec.Replicas)
		assert.Equal(t, int32(0), *scaled.Spec.Replicas)
	})
}

func TestPatchDeployment(t *testing.T) {
	t.Parallel()

	t.Run("adds annotations without dropping the existing ones", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name:        "web",
				Namespace:   "default",
				Annotations: map[string]string{revisionAnnotation: "3"},
			},
			Spec: appsv1.DeploymentSpec{
				Template: corev1.PodTemplateSpec{
					ObjectMeta: metav1.ObjectMeta{Annotations: map[string]string{"existing": "kept"}},
				},
			},
		}))

		patched, err := k.PatchDeployment("default", "web", models.K8sDeploymentPatchRequest{
			Annotations:    map[string]string{"owner": "platform"},
			PodAnnotations: map[string]string{"kubectl.kubernetes.io/restartedAt": "2026-08-05T00:00:00Z"},
		})
		require.NoError(t, err)

		assert.Equal(t, "platform", patched.Annotations["owner"])
		assert.Equal(t, "3", patched.Annotations[revisionAnnotation], "the server-managed revision must be kept")
		podAnnotations := patched.Spec.Template.Annotations
		assert.Equal(t, "2026-08-05T00:00:00Z", podAnnotations["kubectl.kubernetes.io/restartedAt"])
		assert.Equal(t, "kept", podAnnotations["existing"], "existing pod annotations must be kept")
	})
}

func TestDeleteDeployment(t *testing.T) {
	t.Parallel()

	t.Run("deletes the deployment", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default"},
		}))

		require.NoError(t, k.DeleteDeployment("default", "web"))

		_, err := k.cli.AppsV1().Deployments("default").Get(t.Context(), "web", metav1.GetOptions{})
		assert.True(t, k8serrors.IsNotFound(err), "the deployment should be gone, got %v", err)
	})

	t.Run("reports not found when the deployment does not exist", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		err := k.DeleteDeployment("default", "missing")
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not found error, got %v", err)
	})
}
