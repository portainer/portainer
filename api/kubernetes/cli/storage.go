package cli

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (kcl *KubeClient) GetStorage() ([]portainer.KubernetesStorageClassConfig, error) {
	var storages []portainer.KubernetesStorageClassConfig

	storageClient := kcl.cli.StorageV1().StorageClasses()
	storageList, err := storageClient.List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return storages, err
	}

	for _, s := range storageList.Items {
		var storage portainer.KubernetesStorageClassConfig

		v, ok := s.Annotations["storageclass.kubernetes.io/is-default-class"]
		if !ok || v != "true" {
			continue
		}
		storage.Name = s.Name
		storage.Provisioner = s.Provisioner
		storage.AccessModes = []string{"RWO"}
		if s.AllowVolumeExpansion != nil {
			storage.AllowVolumeExpansion = *s.AllowVolumeExpansion
		}

		storages = append(storages, storage)
	}

	return storages, nil
}
