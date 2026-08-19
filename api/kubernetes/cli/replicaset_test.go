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
	"k8s.io/apimachinery/pkg/types"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestGetReplicaSets(t *testing.T) {
	t.Parallel()

	newDeployment := func(name, namespace string, uid types.UID) *appsv1.Deployment {
		return &appsv1.Deployment{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace, UID: uid}}
	}

	// A nil owner produces a replica set with no owner references.
	newReplicaSet := func(name, namespace string, owner *appsv1.Deployment) *appsv1.ReplicaSet {
		rs := &appsv1.ReplicaSet{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}}
		if owner != nil {
			isController := true
			rs.OwnerReferences = []metav1.OwnerReference{{
				Kind:       "Deployment",
				Name:       owner.Name,
				UID:        owner.UID,
				Controller: &isController,
			}}
		}

		return rs
	}

	web := newDeployment("web", "ns-a", "web-uid")

	t.Run("admin gets all replica sets across namespaces", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newReplicaSet("rs-a", "ns-a", nil),
			newReplicaSet("rs-b", "ns-b", nil),
		)}
		kcl.SetIsKubeAdmin(true)

		replicaSets, err := kcl.GetReplicaSets("", "", models.K8sResourceListOptions{})
		require.NoError(t, err)
		assert.Len(t, replicaSets, 2)
	})

	t.Run("admin scoped to a single namespace gets only that namespace's replica sets", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newReplicaSet("rs-a", "ns-a", nil),
			newReplicaSet("rs-b", "ns-b", nil),
		)}
		kcl.SetIsKubeAdmin(true)

		replicaSets, err := kcl.GetReplicaSets("ns-a", "", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, replicaSets, 1)
		assert.Equal(t, "rs-a", replicaSets[0].Name)
	})

	t.Run("filters to replica sets controlled by the given deployment", func(t *testing.T) {
		t.Parallel()
		db := newDeployment("db", "ns-a", "db-uid")
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			web, db,
			newReplicaSet("web-rs-1", "ns-a", web),
			newReplicaSet("web-rs-2", "ns-a", web),
			newReplicaSet("db-rs-1", "ns-a", db),
			newReplicaSet("orphan-rs", "ns-a", nil),
		)}
		kcl.SetIsKubeAdmin(true)

		replicaSets, err := kcl.GetReplicaSets("ns-a", "web", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, replicaSets, 2)
		assert.ElementsMatch(t, []string{"web-rs-1", "web-rs-2"}, []string{replicaSets[0].Name, replicaSets[1].Name})
	})

	t.Run("excludes replica sets left behind by a deleted deployment of the same name", func(t *testing.T) {
		t.Parallel()
		// Same name, different UID: the deployment was deleted and recreated, so its
		// predecessor's replica sets are not revisions of the live deployment.
		deletedWeb := newDeployment("web", "ns-a", "deleted-web-uid")
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			web,
			newReplicaSet("web-rs-current", "ns-a", web),
			newReplicaSet("web-rs-stale", "ns-a", deletedWeb),
		)}
		kcl.SetIsKubeAdmin(true)

		replicaSets, err := kcl.GetReplicaSets("ns-a", "web", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, replicaSets, 1)
		assert.Equal(t, "web-rs-current", replicaSets[0].Name)
	})

	t.Run("excludes replica sets that reference the deployment without being controlled by it", func(t *testing.T) {
		t.Parallel()
		notControlled := newReplicaSet("web-rs-not-controlled", "ns-a", web)
		notControlled.OwnerReferences[0].Controller = nil
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			web,
			newReplicaSet("web-rs-current", "ns-a", web),
			notControlled,
		)}
		kcl.SetIsKubeAdmin(true)

		replicaSets, err := kcl.GetReplicaSets("ns-a", "web", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, replicaSets, 1)
		assert.Equal(t, "web-rs-current", replicaSets[0].Name)
	})

	t.Run("returns a not found error when the given deployment does not exist", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(newReplicaSet("web-rs-1", "ns-a", web))}
		kcl.SetIsKubeAdmin(true)

		_, err := kcl.GetReplicaSets("ns-a", "web", models.K8sResourceListOptions{})
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a Kubernetes not found error, got %v", err)
	})

	t.Run("returns a not found error when the deployment does not exist and no replica sets are visible", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset()}
		kcl.SetIsKubeAdmin(true)

		_, err := kcl.GetReplicaSets("ns-a", "web", models.K8sResourceListOptions{})
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a Kubernetes not found error, got %v", err)
	})

	t.Run("returns an empty list when the deployment exists but owns no replica sets", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(web)}
		kcl.SetIsKubeAdmin(true)

		replicaSets, err := kcl.GetReplicaSets("ns-a", "web", models.K8sResourceListOptions{})
		require.NoError(t, err)
		assert.Empty(t, replicaSets)
	})

	t.Run("strips managed fields and last-applied annotation but keeps the pod template", func(t *testing.T) {
		t.Parallel()
		rs := newReplicaSet("web-rs-1", "ns-a", web)
		rs.ManagedFields = []metav1.ManagedFieldsEntry{{Manager: "kubectl"}}
		rs.Annotations = map[string]string{
			lastAppliedConfigAnnotation:         `{"huge":"manifest"}`,
			"deployment.kubernetes.io/revision": "3",
		}
		rs.Spec.Template.Spec.Containers = []corev1.Container{{Name: "app", Image: "nginx:1.27"}}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(web, rs)}
		kcl.SetIsKubeAdmin(true)

		replicaSets, err := kcl.GetReplicaSets("ns-a", "web", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, replicaSets, 1)
		assert.Empty(t, replicaSets[0].ManagedFields, "managed fields should be stripped")
		_, hasLastApplied := replicaSets[0].Annotations[lastAppliedConfigAnnotation]
		assert.False(t, hasLastApplied, "last-applied annotation should be stripped")
		assert.Equal(t, "3", replicaSets[0].Annotations["deployment.kubernetes.io/revision"], "other annotations are preserved")
		require.Len(t, replicaSets[0].Spec.Template.Spec.Containers, 1, "pod template must be preserved for rollback")
		assert.Equal(t, "nginx:1.27", replicaSets[0].Spec.Template.Spec.Containers[0].Image)
	})

	t.Run("non-admin with no accessible namespaces gets no replica sets", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(newReplicaSet("rs-a", "ns-a", nil))}
		kcl.SetIsKubeAdmin(false)

		replicaSets, err := kcl.GetReplicaSets("", "", models.K8sResourceListOptions{})
		require.NoError(t, err)
		assert.Empty(t, replicaSets)
	})

	t.Run("non-admin gets only replica sets in accessible namespaces", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newReplicaSet("rs-a", "ns-a", nil),
			newReplicaSet("rs-b", "ns-b", nil),
			newReplicaSet("rs-c", "ns-c", nil),
		)}
		kcl.SetIsKubeAdmin(false)
		kcl.SetClientNonAdminNamespaces([]string{"ns-a", "ns-c"})

		replicaSets, err := kcl.GetReplicaSets("", "", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, replicaSets, 2)
		assert.ElementsMatch(t, []string{"rs-a", "rs-c"}, []string{replicaSets[0].Name, replicaSets[1].Name})
	})

	t.Run("non-admin never sees system namespace replica sets even when granted access", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newReplicaSet("rs-a", "ns-a", nil),
			newReplicaSet("rs-sys", "kube-system", nil),
		)}
		kcl.SetIsKubeAdmin(false)
		kcl.SetClientNonAdminNamespaces([]string{"ns-a", "kube-system"})

		replicaSets, err := kcl.GetReplicaSets("", "", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, replicaSets, 1)
		assert.Equal(t, "rs-a", replicaSets[0].Name)
	})
}
