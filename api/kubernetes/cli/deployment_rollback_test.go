package cli

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	kfake "k8s.io/client-go/kubernetes/fake"
)

const rollbackDeploymentUID = types.UID("web-uid")

func rollbackDeployment(image string) *appsv1.Deployment {
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default", UID: rollbackDeploymentUID},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{MatchLabels: map[string]string{"app": "web"}},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: map[string]string{"app": "web"}},
				Spec:       corev1.PodSpec{Containers: []corev1.Container{{Name: "app", Image: image}}},
			},
		},
	}
}

// revisionReplicaSet builds a replica set recording one revision of the web deployment,
// carrying the pod-template-hash label the deployment controller adds.
func revisionReplicaSet(name, revision, image string, owner types.UID) *appsv1.ReplicaSet {
	isController := true
	return &appsv1.ReplicaSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:        name,
			Namespace:   "default",
			Annotations: map[string]string{revisionAnnotation: revision},
			OwnerReferences: []metav1.OwnerReference{{
				Kind:       "Deployment",
				Name:       "web",
				UID:        owner,
				Controller: &isController,
			}},
		},
		Spec: appsv1.ReplicaSetSpec{
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: map[string]string{"app": "web", podTemplateHashLabel: name}},
				Spec:       corev1.PodSpec{Containers: []corev1.Container{{Name: "app", Image: image}}},
			},
		},
	}
}

func TestRolloutUndo(t *testing.T) {
	t.Parallel()

	t.Run("replays the pod template of the requested revision", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(
			rollbackDeployment("nginx:1.27"),
			revisionReplicaSet("web-1", "1", "nginx:1.25", rollbackDeploymentUID),
			revisionReplicaSet("web-2", "2", "nginx:1.26", rollbackDeploymentUID),
			revisionReplicaSet("web-3", "3", "nginx:1.27", rollbackDeploymentUID),
		))

		rolledBack, err := k.RolloutUndo("default", "web", 1)
		require.NoError(t, err)
		assert.Equal(t, "nginx:1.25", rolledBack.Spec.Template.Spec.Containers[0].Image)
		assert.NotContains(t, rolledBack.Spec.Template.Labels, podTemplateHashLabel,
			"the pod template hash must be stripped or the rolled back pods stay with the old replica set")
		assert.Equal(t, "web", rolledBack.Spec.Template.Labels["app"], "the other template labels are kept")
	})

	t.Run("falls back to the revision before the current one when none is given", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(
			rollbackDeployment("nginx:1.27"),
			revisionReplicaSet("web-1", "1", "nginx:1.25", rollbackDeploymentUID),
			revisionReplicaSet("web-2", "2", "nginx:1.26", rollbackDeploymentUID),
			revisionReplicaSet("web-3", "3", "nginx:1.27", rollbackDeploymentUID),
		))

		rolledBack, err := k.RolloutUndo("default", "web", 0)
		require.NoError(t, err)
		assert.Equal(t, "nginx:1.26", rolledBack.Spec.Template.Spec.Containers[0].Image)
	})

	t.Run("orders the history numerically rather than lexically", func(t *testing.T) {
		t.Parallel()
		// Revision 10 is the current one, so the previous revision is 9, not 2. A string
		// ordering would pick revision 9 as the highest and roll back to 2.
		k := NewTestKubeClient(kfake.NewClientset(
			rollbackDeployment("nginx:1.30"),
			revisionReplicaSet("web-2", "2", "nginx:1.22", rollbackDeploymentUID),
			revisionReplicaSet("web-9", "9", "nginx:1.29", rollbackDeploymentUID),
			revisionReplicaSet("web-10", "10", "nginx:1.30", rollbackDeploymentUID),
		))

		rolledBack, err := k.RolloutUndo("default", "web", 0)
		require.NoError(t, err)
		assert.Equal(t, "nginx:1.29", rolledBack.Spec.Template.Spec.Containers[0].Image)
	})

	t.Run("ignores replica sets belonging to a different deployment of the same name", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(
			rollbackDeployment("nginx:1.27"),
			revisionReplicaSet("web-1", "1", "nginx:1.25", rollbackDeploymentUID),
			revisionReplicaSet("web-2", "2", "nginx:1.27", rollbackDeploymentUID),
			// Left behind by a deployment that was deleted and recreated under the same name.
			revisionReplicaSet("web-stale", "3", "postgres:16", "deleted-web-uid"),
		))

		rolledBack, err := k.RolloutUndo("default", "web", 0)
		require.NoError(t, err)
		assert.Equal(t, "nginx:1.25", rolledBack.Spec.Template.Spec.Containers[0].Image)

		_, err = k.RolloutUndo("default", "web", 3)
		require.ErrorIs(t, err, ErrRevisionNotFound, "a foreign replica set is not part of this rollout history")
	})

	t.Run("reports a missing revision", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(
			rollbackDeployment("nginx:1.27"),
			revisionReplicaSet("web-1", "1", "nginx:1.25", rollbackDeploymentUID),
			revisionReplicaSet("web-2", "2", "nginx:1.27", rollbackDeploymentUID),
		))

		_, err := k.RolloutUndo("default", "web", 7)
		require.ErrorIs(t, err, ErrRevisionNotFound)
	})

	t.Run("reports that there is nothing to roll back to", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(
			rollbackDeployment("nginx:1.27"),
			revisionReplicaSet("web-1", "1", "nginx:1.27", rollbackDeploymentUID),
		))

		_, err := k.RolloutUndo("default", "web", 0)
		require.ErrorIs(t, err, ErrNoRolloutHistory)
	})

	t.Run("skips a replica set whose revision annotation is unusable", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(
			rollbackDeployment("nginx:1.27"),
			revisionReplicaSet("web-1", "1", "nginx:1.25", rollbackDeploymentUID),
			revisionReplicaSet("web-2", "2", "nginx:1.27", rollbackDeploymentUID),
			revisionReplicaSet("web-broken", "not-a-number", "redis:7", rollbackDeploymentUID),
		))

		rolledBack, err := k.RolloutUndo("default", "web", 0)
		require.NoError(t, err)
		assert.Equal(t, "nginx:1.25", rolledBack.Spec.Template.Spec.Containers[0].Image)
	})

	t.Run("reports not found when the deployment does not exist", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		_, err := k.RolloutUndo("default", "missing", 0)
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not found error, got %v", err)
	})
}
