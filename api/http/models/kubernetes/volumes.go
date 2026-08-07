package kubernetes

import (
	"errors"
	"net/http"
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
		Labels                        map[string]string                    `json:"labels,omitempty"`
		AccessModes                   []string                             `json:"accessModes,omitempty"`
		HumanReadableAccessModes      []corev1.PersistentVolumeAccessMode  `json:"humanReadableAccessModes,omitempty"`
		Capacity                      corev1.ResourceList                  `json:"capacity"`
		ClaimRef                      *corev1.ObjectReference              `json:"claimRef"`
		StorageClassName              string                               `json:"storageClassName,omitempty"`
		PersistentVolumeReclaimPolicy corev1.PersistentVolumeReclaimPolicy `json:"persistentVolumeReclaimPolicy"`
		VolumeMode                    *corev1.PersistentVolumeMode         `json:"volumeMode"`
		CSI                           *corev1.CSIPersistentVolumeSource    `json:"csi,omitempty"`
		Status                        corev1.PersistentVolumePhase         `json:"status"`
		CreationDate                  time.Time                            `json:"creationDate"`
	}

	K8sPersistentVolumeClaim struct {
		ID                       string                              `json:"id"`
		Name                     string                              `json:"name"`
		Namespace                string                              `json:"namespace"`
		Storage                  int64                               `json:"storage"`
		StorageRequest           string                              `json:"storageRequest"`
		CreationDate             time.Time                           `json:"creationDate"`
		AccessModes              []string                            `json:"accessModes,omitempty"`
		HumanReadableAccessModes []corev1.PersistentVolumeAccessMode `json:"humanReadableAccessModes,omitempty"`
		VolumeName               string                              `json:"volumeName"`
		ResourcesRequests        *corev1.ResourceList                `json:"resourcesRequests"`
		StorageClass             *string                             `json:"storageClass"`
		AllowVolumeExpansion     bool                                `json:"allowVolumeExpansion"`
		VolumeMode               *corev1.PersistentVolumeMode        `json:"volumeMode"`
		OwningApplications       []K8sApplication                    `json:"owningApplications,omitempty"`
		Phase                    corev1.PersistentVolumeClaimPhase   `json:"phase"`
		Labels                   map[string]string                   `json:"labels,omitempty"`
	}

	K8sStorageClass struct {
		Name                 string                                `json:"name"`
		Provisioner          string                                `json:"provisioner"`
		ReclaimPolicy        *corev1.PersistentVolumeReclaimPolicy `json:"reclaimPolicy"`
		AllowVolumeExpansion *bool                                 `json:"allowVolumeExpansion"`
		IsDefault            bool                                  `json:"isDefault"`
		Annotations          map[string]string                     `json:"annotations,omitempty"`
		Labels               map[string]string                     `json:"labels,omitempty"`
		CreationDate         time.Time                             `json:"creationDate"`
		Parameters           map[string]string                     `json:"parameters,omitempty"`
		MountOptions         []string                              `json:"mountOptions,omitempty"`
	}

	// K8sVolumeDeleteRequest represents a request to delete a PVC.
	K8sVolumeDeleteRequest struct {
		Namespace string `json:"namespace"`
		Name      string `json:"name"`
	}

	// K8sVolumeDeleteRequests is a list of PVC delete requests.
	K8sVolumeDeleteRequests []K8sVolumeDeleteRequest

	// K8sPVDeleteRequest represents a request to delete PVs.
	K8sPVDeleteRequest []string

	// K8sStorageClassDeleteRequest represents a request to delete storage classes.
	K8sStorageClassDeleteRequest []string

	// K8sPVCResizeRequest represents a request to resize a PVC.
	K8sPVCResizeRequest struct {
		Namespace string `json:"namespace"`
		Name      string `json:"name"`
		NewSize   string `json:"newSize"`
	}

	// K8sPVReclaimPolicyRequest represents a request to change PV reclaim policy.
	K8sPVReclaimPolicyRequest struct {
		Name          string                               `json:"name"`
		ReclaimPolicy corev1.PersistentVolumeReclaimPolicy `json:"reclaimPolicy"`
	}

	// K8sPersistentVolumeClaimCreateRequest represents a request to create a PVC. The
	// namespace comes from the request route rather than the payload, and the storage
	// class is left to the cluster default when empty. AccessModes defaults to
	// ReadWriteOnce, the only mode a single-writer workload needs.
	K8sPersistentVolumeClaimCreateRequest struct {
		Name         string                              `json:"name"`
		Storage      string                              `json:"storage"`
		StorageClass string                              `json:"storageClass,omitempty"`
		AccessModes  []corev1.PersistentVolumeAccessMode `json:"accessModes,omitempty"`
		VolumeMode   *corev1.PersistentVolumeMode        `json:"volumeMode,omitempty"`
		Labels       map[string]string                   `json:"labels,omitempty"`
		Annotations  map[string]string                   `json:"annotations,omitempty"`
	}
)

func (r K8sPVDeleteRequest) Validate(_ *http.Request) error {
	if len(r) == 0 {
		return errors.New("missing persistent volume names from the request payload")
	}

	return nil
}

func (r K8sStorageClassDeleteRequest) Validate(_ *http.Request) error {
	if len(r) == 0 {
		return errors.New("missing storage class names from the request payload")
	}

	return nil
}

func (r K8sVolumeDeleteRequests) Validate(_ *http.Request) error {
	if len(r) == 0 {
		return errors.New("missing PVC delete requests from the request payload")
	}

	return nil
}

func (r *K8sPVCResizeRequest) Validate(_ *http.Request) error {
	if r.Namespace == "" {
		return errors.New("missing namespace from the request payload")
	}

	if r.Name == "" {
		return errors.New("missing PVC name from the request payload")
	}

	if r.NewSize == "" {
		return errors.New("missing new size from the request payload")
	}

	return nil
}

func (r *K8sPVReclaimPolicyRequest) Validate(_ *http.Request) error {
	if r.Name == "" {
		return errors.New("missing persistent volume name from the request payload")
	}

	if r.ReclaimPolicy == "" {
		return errors.New("missing reclaim policy from the request payload")
	}

	return nil
}

func (r *K8sPersistentVolumeClaimCreateRequest) Validate(_ *http.Request) error {
	if r.Name == "" {
		return errors.New("missing PVC name from the request payload")
	}

	if r.Storage == "" {
		return errors.New("missing storage size from the request payload")
	}

	// The quantity notation is checked by the Kubernetes API, which reports the offending
	// value precisely.
	return nil
}
