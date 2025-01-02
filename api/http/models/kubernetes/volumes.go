package kubernetes

import (
	"time"

	corev1 "k8s.io/api/core/v1"
)

type (
	K8sVolumeInfo struct {
		PersistentVolume      K8sPersistentVolume      `json:"persistentVolume"`
		PersistentVolumeClaim K8sPersistentVolumeClaim `json:"persistentVolumeClaim"`
		StorageClass          K8sStorageClass          `json:"storageClass"`
	}

	K8sPersistentVolume struct {
		Name                          string                               `json:"name,omitempty"`
		Annotations                   map[string]string                    `json:"annotations,omitempty"`
		AccessModes                   []corev1.PersistentVolumeAccessMode  `json:"accessModes,omitempty"`
		Capacity                      corev1.ResourceList                  `json:"capacity"`
		ClaimRef                      *corev1.ObjectReference              `json:"claimRef"`
		StorageClassName              string                               `json:"storageClassName,omitempty"`
		PersistentVolumeReclaimPolicy corev1.PersistentVolumeReclaimPolicy `json:"persistentVolumeReclaimPolicy"`
		VolumeMode                    *corev1.PersistentVolumeMode         `json:"volumeMode"`
		CSI                           *corev1.CSIPersistentVolumeSource    `json:"csi,omitempty"`
	}

	K8sPersistentVolumeClaim struct {
		ID                 string                              `json:"id"`
		Name               string                              `json:"name"`
		Namespace          string                              `json:"namespace"`
		Storage            int64                               `json:"storage"`
		CreationDate       time.Time                           `json:"creationDate"`
		AccessModes        []corev1.PersistentVolumeAccessMode `json:"accessModes,omitempty"`
		VolumeName         string                              `json:"volumeName"`
		ResourcesRequests  *corev1.ResourceList                `json:"resourcesRequests"`
		StorageClass       *string                             `json:"storageClass"`
		VolumeMode         *corev1.PersistentVolumeMode        `json:"volumeMode"`
		OwningApplications []K8sApplication                    `json:"owningApplications,omitempty"`
		Phase              corev1.PersistentVolumeClaimPhase   `json:"phase"`
		Labels             map[string]string                   `json:"labels"`
	}

	K8sStorageClass struct {
		Name                 string                                `json:"name"`
		Provisioner          string                                `json:"provisioner"`
		ReclaimPolicy        *corev1.PersistentVolumeReclaimPolicy `json:"reclaimPolicy"`
		AllowVolumeExpansion *bool                                 `json:"allowVolumeExpansion"`
	}
)
