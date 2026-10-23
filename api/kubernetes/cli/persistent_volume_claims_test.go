package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	storagev1 "k8s.io/api/storage/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func makeStorageClass(name string, allowExpansion bool) *storagev1.StorageClass {
	return &storagev1.StorageClass{
		ObjectMeta:           metav1.ObjectMeta{Name: name},
		Provisioner:          "kubernetes.io/no-provisioner",
		AllowVolumeExpansion: &allowExpansion,
	}
}

func makePVC(namespace, name, scName string) *corev1.PersistentVolumeClaim {
	storageRequest := resource.MustParse("1Gi")
	pvc := &corev1.PersistentVolumeClaim{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: corev1.PersistentVolumeClaimSpec{
			Resources: corev1.VolumeResourceRequirements{
				Requests: corev1.ResourceList{
					corev1.ResourceStorage: storageRequest,
				},
			},
		},
	}
	if scName != "" {
		pvc.Spec.StorageClassName = &scName
	}
	return pvc
}

func TestResizePersistentVolumeClaim(t *testing.T) {
	t.Parallel()

	t.Run("returns error when storage class does not allow expansion", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		sc := makeStorageClass("no-expand", false)
		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
		require.NoError(t, err)

		pvc := makePVC("default", "pvc-no-expand", "no-expand")
		_, err = k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		err = k.ResizePersistentVolumeClaim("default", "pvc-no-expand", "2Gi")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "does not allow volume expansion")
	})

	t.Run("returns error for invalid size format", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		sc := makeStorageClass("expandable", true)
		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
		require.NoError(t, err)

		pvc := makePVC("default", "pvc-badsize", "expandable")
		_, err = k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		err = k.ResizePersistentVolumeClaim("default", "pvc-badsize", "notasize")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "invalid size format")
	})

	t.Run("success when storage class allows expansion with valid size", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		sc := makeStorageClass("expandable", true)
		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
		require.NoError(t, err)

		pvc := makePVC("default", "pvc-resize", "expandable")
		_, err = k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		err = k.ResizePersistentVolumeClaim("default", "pvc-resize", "5Gi")
		require.NoError(t, err)
	})

	t.Run("success when PVC has no storage class", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		pvc := makePVC("default", "pvc-no-sc", "")
		_, err := k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		err = k.ResizePersistentVolumeClaim("default", "pvc-no-sc", "10Gi")
		require.NoError(t, err)
	})

	t.Run("returns error for non-existent PVC", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		err := k.ResizePersistentVolumeClaim("default", "does-not-exist", "2Gi")
		require.Error(t, err)
	})
}

func TestGetPersistentVolumeClaims_EnrichesExpansionFlag(t *testing.T) {
	t.Parallel()

	t.Run("PVC with AllowVolumeExpansion=true SC gets flag true", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		sc := makeStorageClass("expandable", true)
		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
		require.NoError(t, err)

		pvc := makePVC("default", "pvc-expand", "expandable")
		_, err = k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)
		require.Len(t, pvcs, 1)
		assert.True(t, pvcs[0].AllowVolumeExpansion)
	})

	t.Run("PVC with AllowVolumeExpansion=false SC gets flag false", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		sc := makeStorageClass("not-expandable", false)
		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
		require.NoError(t, err)

		pvc := makePVC("default", "pvc-no-expand", "not-expandable")
		_, err = k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)
		require.Len(t, pvcs, 1)
		assert.False(t, pvcs[0].AllowVolumeExpansion)
	})
}

func makePod(namespace, name, pvcName string) *corev1.Pod {
	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
		Spec: corev1.PodSpec{
			Volumes: []corev1.Volume{
				{
					Name: "data",
					VolumeSource: corev1.VolumeSource{
						PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
							ClaimName: pvcName,
						},
					},
				},
			},
			Containers: []corev1.Container{{Name: "app", Image: "nginx"}},
		},
	}
}

func makePodWithDeploymentOwner(namespace, name, pvcName, rsName string) *corev1.Pod {
	pod := makePod(namespace, name, pvcName)
	pod.OwnerReferences = []metav1.OwnerReference{
		{Kind: "ReplicaSet", Name: rsName, APIVersion: "apps/v1"},
	}
	return pod
}

func makeReplicaSet(namespace, name, deploymentName string) *appsv1.ReplicaSet {
	return &appsv1.ReplicaSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			OwnerReferences: []metav1.OwnerReference{
				{Kind: "Deployment", Name: deploymentName, APIVersion: "apps/v1"},
			},
		},
	}
}

func makeDeployment(namespace, name string) *appsv1.Deployment {
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{},
		},
	}
}

func TestCombineClaimsWithApplications(t *testing.T) {
	t.Parallel()

	t.Run("no pods leaves owningApplications empty", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		pvc := makePVC("default", "my-pvc", "")
		_, err := k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)

		result, err := k.CombineClaimsWithApplications(pvcs)
		require.NoError(t, err)
		require.Len(t, result, 1)
		assert.Empty(t, result[0].OwningApplications)
	})

	t.Run("pod with no PVC volumes leaves owningApplications empty", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		pvc := makePVC("default", "my-pvc", "")
		_, err := k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		pod := &corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{Name: "app", Namespace: "default"},
			Spec: corev1.PodSpec{
				Containers: []corev1.Container{{Name: "app", Image: "nginx"}},
			},
		}
		_, err = k.cli.CoreV1().Pods("default").Create(t.Context(), pod, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)

		result, err := k.CombineClaimsWithApplications(pvcs)
		require.NoError(t, err)
		assert.Empty(t, result[0].OwningApplications)
	})

	t.Run("pod mounting PVC populates owningApplications", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		pvc := makePVC("default", "my-pvc", "")
		_, err := k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		pod := makePod("default", "my-pod", "my-pvc")
		_, err = k.cli.CoreV1().Pods("default").Create(t.Context(), pod, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)

		result, err := k.CombineClaimsWithApplications(pvcs)
		require.NoError(t, err)
		require.Len(t, result[0].OwningApplications, 1)
		assert.Equal(t, "my-pod", result[0].OwningApplications[0].Name)
		assert.Equal(t, "Pod", result[0].OwningApplications[0].ApplicationType)
		assert.Equal(t, "default", result[0].OwningApplications[0].ResourcePool)
	})

	t.Run("pod in different namespace does not match PVC", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		pvc := makePVC("default", "my-pvc", "")
		_, err := k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		pod := makePod("other-ns", "other-pod", "my-pvc")
		_, err = k.cli.CoreV1().Pods("other-ns").Create(t.Context(), pod, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)

		result, err := k.CombineClaimsWithApplications(pvcs)
		require.NoError(t, err)
		assert.Empty(t, result[0].OwningApplications)
	})

	t.Run("two pods mounting the same PVC from the same Deployment are deduplicated", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		pvc := makePVC("default", "shared-pvc", "")
		_, err := k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		deploy := makeDeployment("default", "my-deploy")
		_, err = k.cli.AppsV1().Deployments("default").Create(t.Context(), deploy, metav1.CreateOptions{})
		require.NoError(t, err)

		rs := makeReplicaSet("default", "my-deploy-rs", "my-deploy")
		_, err = k.cli.AppsV1().ReplicaSets("default").Create(t.Context(), rs, metav1.CreateOptions{})
		require.NoError(t, err)

		pod1 := makePodWithDeploymentOwner("default", "my-deploy-pod-1", "shared-pvc", "my-deploy-rs")
		pod2 := makePodWithDeploymentOwner("default", "my-deploy-pod-2", "shared-pvc", "my-deploy-rs")
		_, err = k.cli.CoreV1().Pods("default").Create(t.Context(), pod1, metav1.CreateOptions{})
		require.NoError(t, err)
		_, err = k.cli.CoreV1().Pods("default").Create(t.Context(), pod2, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)

		result, err := k.CombineClaimsWithApplications(pvcs)
		require.NoError(t, err)
		require.Len(t, result[0].OwningApplications, 1)
		assert.Equal(t, "my-deploy", result[0].OwningApplications[0].Name)
		assert.Equal(t, "Deployment", result[0].OwningApplications[0].ApplicationType)
	})

	t.Run("pod owned by Deployment resolves application name to Deployment", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		pvc := makePVC("default", "app-pvc", "")
		_, err := k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		deploy := makeDeployment("default", "web-app")
		_, err = k.cli.AppsV1().Deployments("default").Create(t.Context(), deploy, metav1.CreateOptions{})
		require.NoError(t, err)

		rs := makeReplicaSet("default", "web-app-rs-abc", "web-app")
		_, err = k.cli.AppsV1().ReplicaSets("default").Create(t.Context(), rs, metav1.CreateOptions{})
		require.NoError(t, err)

		pod := makePodWithDeploymentOwner("default", "web-app-pod-xyz", "app-pvc", "web-app-rs-abc")
		_, err = k.cli.CoreV1().Pods("default").Create(t.Context(), pod, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)

		result, err := k.CombineClaimsWithApplications(pvcs)
		require.NoError(t, err)
		require.Len(t, result[0].OwningApplications, 1)
		assert.Equal(t, "web-app", result[0].OwningApplications[0].Name)
		assert.Equal(t, "Deployment", result[0].OwningApplications[0].ApplicationType)
		assert.Equal(t, "default", result[0].OwningApplications[0].ResourcePool)
	})

	t.Run("unrelated pod mounting a different PVC does not affect result", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		pvc := makePVC("default", "target-pvc", "")
		_, err := k.cli.CoreV1().PersistentVolumeClaims("default").Create(t.Context(), pvc, metav1.CreateOptions{})
		require.NoError(t, err)

		pod := makePod("default", "unrelated-pod", "other-pvc")
		_, err = k.cli.CoreV1().Pods("default").Create(t.Context(), pod, metav1.CreateOptions{})
		require.NoError(t, err)

		pvcs, err := k.GetPersistentVolumeClaims("default")
		require.NoError(t, err)

		result, err := k.CombineClaimsWithApplications(pvcs)
		require.NoError(t, err)
		assert.Empty(t, result[0].OwningApplications)
	})
}

func TestCreatePersistentVolumeClaim(t *testing.T) {
	t.Parallel()

	t.Run("creates the claim with the requested storage and class", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())
		storageClass := "fast"

		created, err := k.CreatePersistentVolumeClaim("default", models.K8sPersistentVolumeClaimCreateRequest{
			Name:         "web-data",
			Storage:      "1Gi",
			StorageClass: storageClass,
			Labels:       map[string]string{"app": "web"},
		})
		require.NoError(t, err)
		assert.Equal(t, "web-data", created.Name)
		assert.Equal(t, "1Gi", created.StorageRequest)

		stored, err := k.cli.CoreV1().PersistentVolumeClaims("default").Get(t.Context(), "web-data", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, resource.MustParse("1Gi"), stored.Spec.Resources.Requests[corev1.ResourceStorage])
		require.NotNil(t, stored.Spec.StorageClassName)
		assert.Equal(t, storageClass, *stored.Spec.StorageClassName)
		assert.Equal(t, map[string]string{"app": "web"}, stored.Labels)
	})

	t.Run("defaults the access mode and leaves the storage class to the cluster", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		_, err := k.CreatePersistentVolumeClaim("default", models.K8sPersistentVolumeClaimCreateRequest{
			Name:    "web-data",
			Storage: "1Gi",
		})
		require.NoError(t, err)

		stored, err := k.cli.CoreV1().PersistentVolumeClaims("default").Get(t.Context(), "web-data", metav1.GetOptions{})
		require.NoError(t, err)
		assert.Equal(t, []corev1.PersistentVolumeAccessMode{corev1.ReadWriteOnce}, stored.Spec.AccessModes)
		assert.Nil(t, stored.Spec.StorageClassName, "an empty class must stay unset so the default applies")
	})

	t.Run("rejects a storage size that is not a quantity", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		_, err := k.CreatePersistentVolumeClaim("default", models.K8sPersistentVolumeClaimCreateRequest{
			Name:    "web-data",
			Storage: "1 gigabyte",
		})
		require.Error(t, err)
		assert.ErrorIs(t, err, resource.ErrFormatWrong)
	})

	t.Run("reports a conflict when the claim already exists", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset(&corev1.PersistentVolumeClaim{
			ObjectMeta: metav1.ObjectMeta{Name: "web-data", Namespace: "default"},
		}))

		_, err := k.CreatePersistentVolumeClaim("default", models.K8sPersistentVolumeClaimCreateRequest{
			Name:    "web-data",
			Storage: "1Gi",
		})
		require.Error(t, err)
		assert.True(t, k8serrors.IsAlreadyExists(err), "expected an already exists error, got %v", err)
	})
}
