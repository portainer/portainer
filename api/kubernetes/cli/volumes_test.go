package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"

	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestGetVolumes(t *testing.T) {
	t.Parallel()
	kcl := &KubeClient{}

	volumes, err := kcl.GetVolumes("default")
	require.NoError(t, err)
	require.Empty(t, volumes)
}

// TestUpdateVolumesWithOwningApplicationsSkipsNilApplication exercises the case
// where ConvertPodToApplication returns a nil application (a pod with no ID and
// no name), so updateVolumesWithOwningApplications must skip it instead of
// dereferencing a nil pointer.
func TestUpdateVolumesWithOwningApplicationsSkipsNilApplication(t *testing.T) {
	t.Parallel()

	kcl := &KubeClient{}

	volumes := []models.K8sVolumeInfo{
		{
			PersistentVolumeClaim: models.K8sPersistentVolumeClaim{
				Name:      "claim-1",
				Namespace: "default",
			},
		},
	}

	pods := &corev1.PodList{
		Items: []corev1.Pod{
			{
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							VolumeSource: corev1.VolumeSource{
								PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
									ClaimName: "claim-1",
								},
							},
						},
					},
				},
			},
		},
	}
	pods.Items[0].Namespace = "default"

	result, err := kcl.updateVolumesWithOwningApplications(&volumes, pods, []appsv1.Deployment{}, []appsv1.ReplicaSet{}, []appsv1.StatefulSet{}, []appsv1.DaemonSet{})
	require.NoError(t, err)
	require.Empty(t, (*result)[0].PersistentVolumeClaim.OwningApplications)
}

// TestUpdateVolumesWithOwningApplicationsAppendsNonNilApplication exercises the
// counterpart append path, where ConvertPodToApplication returns a non-nil
// application (a named pod) that is not yet present in OwningApplications.
func TestUpdateVolumesWithOwningApplicationsAppendsNonNilApplication(t *testing.T) {
	t.Parallel()

	kcl := &KubeClient{}

	volumes := []models.K8sVolumeInfo{
		{
			PersistentVolumeClaim: models.K8sPersistentVolumeClaim{
				Name:      "claim-1",
				Namespace: "default",
			},
		},
	}

	pods := &corev1.PodList{
		Items: []corev1.Pod{
			{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "pod-1",
					Namespace: "default",
				},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							VolumeSource: corev1.VolumeSource{
								PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
									ClaimName: "claim-1",
								},
							},
						},
					},
				},
			},
		},
	}

	result, err := kcl.updateVolumesWithOwningApplications(&volumes, pods, []appsv1.Deployment{}, []appsv1.ReplicaSet{}, []appsv1.StatefulSet{}, []appsv1.DaemonSet{})
	require.NoError(t, err)
	require.Len(t, (*result)[0].PersistentVolumeClaim.OwningApplications, 1)
	require.Equal(t, "pod-1", (*result)[0].PersistentVolumeClaim.OwningApplications[0].Name)
}
