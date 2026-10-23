package cli

import (
	"context"
	"fmt"

	"github.com/segmentio/encoding/json"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	storagev1 "k8s.io/api/storage/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

const storageClassDefaultAnnotation = "storageclass.kubernetes.io/is-default-class"

// GetStorageClasses returns all StorageClasses in the cluster.
func (kcl *KubeClient) GetStorageClasses() ([]models.K8sStorageClass, error) {
	scList, err := kcl.cli.StorageV1().StorageClasses().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("unable to list storage classes. Error: %w", err)
	}

	results := make([]models.K8sStorageClass, 0, len(scList.Items))
	for i := range scList.Items {
		results = append(results, parseStorageClassDetail(&scList.Items[i]))
	}

	return results, nil
}

// GetStorageClass returns a single StorageClass by name.
func (kcl *KubeClient) GetStorageClass(name string) (*models.K8sStorageClass, error) {
	sc, err := kcl.cli.StorageV1().StorageClasses().Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("unable to get storage class %s. Error: %w", name, err)
	}

	result := parseStorageClassDetail(sc)
	return &result, nil
}

// DeleteStorageClasses deletes the specified StorageClasses by name.
func (kcl *KubeClient) DeleteStorageClasses(names []string) error {
	for _, name := range names {
		log.Debug().
			Str("context", "DeleteStorageClasses").
			Str("storage_class", name).
			Msg("Deleting storage class")

		err := kcl.cli.StorageV1().StorageClasses().Delete(context.Background(), name, metav1.DeleteOptions{})
		if err != nil {
			return fmt.Errorf("unable to delete storage class %s. Error: %w", name, err)
		}
	}

	return nil
}

// SetDefaultStorageClass sets the specified StorageClass as the default.
// It removes the default annotation from any other StorageClass that is currently default.
func (kcl *KubeClient) SetDefaultStorageClass(name string) error {
	_, err := kcl.cli.StorageV1().StorageClasses().Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("unable to find storage class %s. Error: %w", name, err)
	}

	scList, err := kcl.cli.StorageV1().StorageClasses().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("unable to list storage classes. Error: %w", err)
	}

	for i := range scList.Items {
		sc := &scList.Items[i]
		isCurrentDefault := sc.Annotations[storageClassDefaultAnnotation] == "true"
		isTarget := sc.Name == name

		if isTarget && !isCurrentDefault {
			if err := kcl.patchStorageClassDefaultAnnotation(sc.Name, "true"); err != nil {
				return err
			}
		} else if !isTarget && isCurrentDefault {
			if err := kcl.patchStorageClassDefaultAnnotation(sc.Name, "false"); err != nil {
				return err
			}
		}
	}

	return nil
}

func (kcl *KubeClient) patchStorageClassDefaultAnnotation(name, value string) error {
	patch := map[string]any{
		"metadata": map[string]any{
			"annotations": map[string]string{
				storageClassDefaultAnnotation: value,
			},
		},
	}

	patchBytes, err := json.Marshal(patch)
	if err != nil {
		return fmt.Errorf("unable to marshal patch for storage class %s. Error: %w", name, err)
	}

	_, err = kcl.cli.StorageV1().StorageClasses().Patch(
		context.Background(),
		name,
		types.MergePatchType,
		patchBytes,
		metav1.PatchOptions{},
	)
	if err != nil {
		return fmt.Errorf("unable to patch default annotation on storage class %s. Error: %w", name, err)
	}

	return nil
}

// parseStorageClassDetail parses a StorageClass with full detail including default status.
func parseStorageClassDetail(sc *storagev1.StorageClass) models.K8sStorageClass {
	isDefault := sc.Annotations[storageClassDefaultAnnotation] == "true"
	return models.K8sStorageClass{
		Name:                 sc.Name,
		Provisioner:          sc.Provisioner,
		ReclaimPolicy:        sc.ReclaimPolicy,
		AllowVolumeExpansion: sc.AllowVolumeExpansion,
		IsDefault:            isDefault,
		Annotations:          sc.Annotations,
		Labels:               sc.Labels,
		CreationDate:         sc.CreationTimestamp.Time,
		Parameters:           sc.Parameters,
		MountOptions:         sc.MountOptions,
	}
}
