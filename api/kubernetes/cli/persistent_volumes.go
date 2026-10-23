package cli

import (
	"context"
	"fmt"

	"github.com/segmentio/encoding/json"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

// GetPersistentVolumes returns all PersistentVolumes in the cluster.
// For non-admin users, results are filtered to PVs bound to their accessible namespaces.
func (kcl *KubeClient) GetPersistentVolumes() ([]models.K8sPersistentVolume, error) {
	pvList, err := kcl.cli.CoreV1().PersistentVolumes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("unable to list persistent volumes. Error: %w", err)
	}

	results := make([]models.K8sPersistentVolume, 0)
	if kcl.GetIsKubeAdmin() {
		for i := range pvList.Items {
			results = append(results, parsePersistentVolumeDetail(&pvList.Items[i]))
		}
		return results, nil
	}

	allowedNamespaces := kcl.buildNonAdminNamespacesMap()
	for i := range pvList.Items {
		pv := &pvList.Items[i]
		if pv.Spec.ClaimRef != nil {
			if _, ok := allowedNamespaces[pv.Spec.ClaimRef.Namespace]; ok {
				results = append(results, parsePersistentVolumeDetail(pv))
			}
		}
	}
	return results, nil
}

// GetPersistentVolume returns a single PersistentVolume by name.
// For non-admin users, access is restricted to PVs bound to their accessible namespaces.
func (kcl *KubeClient) GetPersistentVolume(name string) (*models.K8sPersistentVolume, error) {
	pv, err := kcl.cli.CoreV1().PersistentVolumes().Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("unable to get persistent volume %s. Error: %w", name, err)
	}

	if !kcl.GetIsKubeAdmin() {
		allowedNamespaces := kcl.buildNonAdminNamespacesMap()
		if pv.Spec.ClaimRef == nil {
			return nil, fmt.Errorf("access to unbound persistent volume %s is not authorized: %w", name, ErrUnauthorized)
		}
		if _, ok := allowedNamespaces[pv.Spec.ClaimRef.Namespace]; !ok {
			return nil, fmt.Errorf("access to persistent volume %s is not authorized: %w", name, ErrUnauthorized)
		}
	}

	result := parsePersistentVolumeDetail(pv)
	return &result, nil
}

// DeletePersistentVolumes deletes the specified PersistentVolumes by name.
func (kcl *KubeClient) DeletePersistentVolumes(names []string) error {
	for _, name := range names {
		log.Debug().
			Str("context", "DeletePersistentVolumes").
			Str("persistent_volume", name).
			Msg("Deleting persistent volume")

		err := kcl.cli.CoreV1().PersistentVolumes().Delete(context.Background(), name, metav1.DeleteOptions{})
		if err != nil {
			return fmt.Errorf("unable to delete persistent volume %s. Error: %w", name, err)
		}
	}

	return nil
}

// UpdatePersistentVolumeReclaimPolicy updates the reclaim policy on a PV.
func (kcl *KubeClient) UpdatePersistentVolumeReclaimPolicy(name string, policy corev1.PersistentVolumeReclaimPolicy) error {
	switch policy {
	case corev1.PersistentVolumeReclaimRetain,
		corev1.PersistentVolumeReclaimDelete,
		corev1.PersistentVolumeReclaimRecycle:
		// valid
	default:
		return fmt.Errorf("invalid reclaim policy %q: must be Retain, Delete, or Recycle", policy)
	}

	patch := map[string]any{
		"spec": map[string]any{
			"persistentVolumeReclaimPolicy": policy,
		},
	}
	patchBytes, err := json.Marshal(patch)
	if err != nil {
		return fmt.Errorf("unable to marshal reclaim policy patch. Error: %w", err)
	}

	_, err = kcl.cli.CoreV1().PersistentVolumes().Patch(
		context.Background(),
		name,
		types.MergePatchType,
		patchBytes,
		metav1.PatchOptions{},
	)
	if err != nil {
		return fmt.Errorf("unable to update reclaim policy for persistent volume %s. Error: %w", name, err)
	}

	return nil
}

// parsePersistentVolumeDetail parses a full PV into the model with status and access modes.
func parsePersistentVolumeDetail(pv *corev1.PersistentVolume) models.K8sPersistentVolume {
	return models.K8sPersistentVolume{
		Name:                          pv.Name,
		Annotations:                   pv.Annotations,
		Labels:                        pv.Labels,
		AccessModes:                   humanReadableAccessModes(pv.Spec.AccessModes),
		HumanReadableAccessModes:      pv.Spec.AccessModes,
		Capacity:                      pv.Spec.Capacity,
		ClaimRef:                      pv.Spec.ClaimRef,
		StorageClassName:              pv.Spec.StorageClassName,
		PersistentVolumeReclaimPolicy: pv.Spec.PersistentVolumeReclaimPolicy,
		VolumeMode:                    pv.Spec.VolumeMode,
		CSI:                           pv.Spec.CSI,
		Status:                        pv.Status.Phase,
		CreationDate:                  pv.CreationTimestamp.Time,
	}
}

// humanReadableAccessModes converts Kubernetes access modes to short abbreviations.
func humanReadableAccessModes(modes []corev1.PersistentVolumeAccessMode) []string {
	readable := make([]string, 0, len(modes))
	for _, mode := range modes {
		switch mode {
		case corev1.ReadWriteOnce:
			readable = append(readable, "RWO")
		case corev1.ReadOnlyMany:
			readable = append(readable, "ROX")
		case corev1.ReadWriteMany:
			readable = append(readable, "RWX")
		case corev1.ReadWriteOncePod:
			readable = append(readable, "RWOP")
		default:
			readable = append(readable, string(mode))
		}
	}

	return readable
}
