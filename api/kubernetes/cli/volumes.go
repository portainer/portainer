package cli

import (
	"context"
	"fmt"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	storagev1 "k8s.io/api/storage/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetVolumes gets the volumes in the current k8s environment(endpoint).
// If the user is an admin, it fetches all the volumes in the cluster.
// If the user is not an admin, it fetches the volumes in the namespaces the user has access to.
// It returns a list of K8sVolumeInfo.
func (kcl *KubeClient) GetVolumes(namespace string) ([]models.K8sVolumeInfo, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchVolumes(namespace)
	}
	return kcl.fetchVolumesForNonAdmin(namespace)
}

// GetVolume gets the volume with the given name and namespace.
func (kcl *KubeClient) GetVolume(namespace, volumeName string) (*models.K8sVolumeInfo, error) {
	persistentVolumeClaim, err := kcl.cli.CoreV1().PersistentVolumeClaims(namespace).Get(context.TODO(), volumeName, metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return nil, nil
		}

		return nil, err
	}

	persistentVolumesMap, storageClassesMap, err := kcl.fetchPersistentVolumesAndStorageClassesMap()
	if err != nil {
		return nil, err
	}

	volume := parseVolume(persistentVolumeClaim, persistentVolumesMap, storageClassesMap)
	return &volume, nil
}

// fetchVolumesForNonAdmin fetches the volumes in the namespaces the user has access to.
// This function is called when the user is not an admin.
// It fetches all the persistent volume claims, persistent volumes and storage classes in the namespaces the user has access to.
func (kcl *KubeClient) fetchVolumesForNonAdmin(namespace string) ([]models.K8sVolumeInfo, error) {
	log.Debug().Msgf("Fetching volumes for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
		return nil, nil
	}

	volumes, err := kcl.fetchVolumes(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sVolumeInfo, 0)
	for _, volume := range volumes {
		if _, ok := nonAdminNamespaceSet[volume.PersistentVolumeClaim.Namespace]; ok {
			results = append(results, volume)
		}
	}

	return results, nil
}

// fetchVolumes fetches all the persistent volume claims, persistent volumes and storage classes in the given namespace.
// It returns a list of K8sVolumeInfo.
// This function is called by fetchVolumesForAdmin and fetchVolumesForNonAdmin.
func (kcl *KubeClient) fetchVolumes(namespace string) ([]models.K8sVolumeInfo, error) {
	volumes := make([]models.K8sVolumeInfo, 0)
	persistentVolumeClaims, err := kcl.cli.CoreV1().PersistentVolumeClaims(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	if len(persistentVolumeClaims.Items) > 0 {
		persistentVolumesMap, storageClassesMap, err := kcl.fetchPersistentVolumesAndStorageClassesMap()
		if err != nil {
			return nil, err
		}

		for _, persistentVolumeClaim := range persistentVolumeClaims.Items {
			volumes = append(volumes, parseVolume(&persistentVolumeClaim, persistentVolumesMap, storageClassesMap))
		}
	}

	return volumes, nil
}

// parseVolume parses the given persistent volume claim and returns a K8sVolumeInfo.
// This function is called by fetchVolumes.
// It returns a K8sVolumeInfo.
func parseVolume(persistentVolumeClaim *corev1.PersistentVolumeClaim, persistentVolumesMap map[string]models.K8sPersistentVolume, storageClassesMap map[string]models.K8sStorageClass) models.K8sVolumeInfo {
	volume := models.K8sVolumeInfo{}
	volumeClaim := parsePersistentVolumeClaim(persistentVolumeClaim)

	if volumeClaim.VolumeName != "" {
		persistentVolume, ok := persistentVolumesMap[volumeClaim.VolumeName]
		if ok {
			volume.PersistentVolume = persistentVolume
		}
	}

	if volumeClaim.StorageClass != nil {
		storageClass, ok := storageClassesMap[*volumeClaim.StorageClass]
		if ok {
			volume.StorageClass = storageClass
		}
	}

	volume.PersistentVolumeClaim = volumeClaim
	return volume
}

// parsePersistentVolumeClaim parses the given persistent volume claim and returns a K8sPersistentVolumeClaim.
func parsePersistentVolumeClaim(volume *corev1.PersistentVolumeClaim) models.K8sPersistentVolumeClaim {
	storage := volume.Spec.Resources.Requests[corev1.ResourceStorage]
	return models.K8sPersistentVolumeClaim{
		ID:                 string(volume.UID),
		Name:               volume.Name,
		Namespace:          volume.Namespace,
		CreationDate:       volume.CreationTimestamp.Time,
		Storage:            storage.Value(),
		AccessModes:        volume.Spec.AccessModes,
		VolumeName:         volume.Spec.VolumeName,
		ResourcesRequests:  &volume.Spec.Resources.Requests,
		StorageClass:       volume.Spec.StorageClassName,
		VolumeMode:         volume.Spec.VolumeMode,
		OwningApplications: nil,
		Phase:              volume.Status.Phase,
		Labels:             volume.Labels,
	}
}

// parsePersistentVolume parses the given persistent volume and returns a K8sPersistentVolume.
func parsePersistentVolume(volume *corev1.PersistentVolume) models.K8sPersistentVolume {
	return models.K8sPersistentVolume{
		Name:                          volume.Name,
		Annotations:                   volume.Annotations,
		AccessModes:                   volume.Spec.AccessModes,
		Capacity:                      volume.Spec.Capacity,
		ClaimRef:                      volume.Spec.ClaimRef,
		StorageClassName:              volume.Spec.StorageClassName,
		PersistentVolumeReclaimPolicy: volume.Spec.PersistentVolumeReclaimPolicy,
		VolumeMode:                    volume.Spec.VolumeMode,
		CSI:                           volume.Spec.CSI,
	}
}

// buildPersistentVolumesMap builds a map of persistent volumes.
func (kcl *KubeClient) buildPersistentVolumesMap(persistentVolumes *corev1.PersistentVolumeList) map[string]models.K8sPersistentVolume {
	persistentVolumesMap := make(map[string]models.K8sPersistentVolume)
	for _, persistentVolume := range persistentVolumes.Items {
		persistentVolumesMap[persistentVolume.Name] = parsePersistentVolume(&persistentVolume)
	}

	return persistentVolumesMap
}

// parseStorageClass parses the given storage class and returns a K8sStorageClass.
func parseStorageClass(storageClass *storagev1.StorageClass) models.K8sStorageClass {
	return models.K8sStorageClass{
		Name:                 storageClass.Name,
		Provisioner:          storageClass.Provisioner,
		ReclaimPolicy:        storageClass.ReclaimPolicy,
		AllowVolumeExpansion: storageClass.AllowVolumeExpansion,
	}
}

// buildStorageClassesMap builds a map of storage classes.
func (kcl *KubeClient) buildStorageClassesMap(storageClasses *storagev1.StorageClassList) map[string]models.K8sStorageClass {
	storageClassesMap := make(map[string]models.K8sStorageClass)
	for _, storageClass := range storageClasses.Items {
		storageClassesMap[storageClass.Name] = parseStorageClass(&storageClass)
	}

	return storageClassesMap
}

// fetchPersistentVolumesAndStorageClassesMap fetches all the persistent volumes and storage classes in the cluster.
// It returns a map of persistent volumes and a map of storage classes.
func (kcl *KubeClient) fetchPersistentVolumesAndStorageClassesMap() (map[string]models.K8sPersistentVolume, map[string]models.K8sStorageClass, error) {
	persistentVolumes, err := kcl.cli.CoreV1().PersistentVolumes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, nil, err
	}
	persistentVolumesMap := kcl.buildPersistentVolumesMap(persistentVolumes)

	storageClasses, err := kcl.cli.StorageV1().StorageClasses().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, nil, err
	}
	storageClassesMap := kcl.buildStorageClassesMap(storageClasses)

	return persistentVolumesMap, storageClassesMap, nil
}

// CombineVolumesWithApplications combines the volumes with the applications that use them.
func (kcl *KubeClient) CombineVolumesWithApplications(volumes *[]models.K8sVolumeInfo) (*[]models.K8sVolumeInfo, error) {
	pods, err := kcl.cli.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return volumes, nil
		}
		log.Error().Err(err).Msg("Failed to list pods across the cluster")
		return nil, fmt.Errorf("an error occurred during the CombineServicesWithApplications operation, unable to list pods across the cluster. Error: %w", err)
	}

	hasReplicaSetOwnerReference := containsReplicaSetOwnerReference(pods)
	replicaSetItems := make([]appsv1.ReplicaSet, 0)
	deploymentItems := make([]appsv1.Deployment, 0)
	if hasReplicaSetOwnerReference {
		replicaSets, err := kcl.cli.AppsV1().ReplicaSets("").List(context.Background(), metav1.ListOptions{})
		if err != nil {
			log.Error().Err(err).Msg("Failed to list replica sets across the cluster")
			return nil, fmt.Errorf("an error occurred during the CombineVolumesWithApplications operation, unable to list replica sets across the cluster. Error: %w", err)
		}
		replicaSetItems = replicaSets.Items

		deployments, err := kcl.cli.AppsV1().Deployments("").List(context.Background(), metav1.ListOptions{})
		if err != nil {
			log.Error().Err(err).Msg("Failed to list deployments across the cluster")
			return nil, fmt.Errorf("an error occurred during the CombineVolumesWithApplications operation, unable to list deployments across the cluster. Error: %w", err)
		}
		deploymentItems = deployments.Items
	}

	hasStatefulSetOwnerReference := containsStatefulSetOwnerReference(pods)
	statefulSetItems := make([]appsv1.StatefulSet, 0)
	if hasStatefulSetOwnerReference {
		statefulSets, err := kcl.cli.AppsV1().StatefulSets("").List(context.Background(), metav1.ListOptions{})
		if err != nil {
			log.Error().Err(err).Msg("Failed to list stateful sets across the cluster")
			return nil, fmt.Errorf("an error occurred during the CombineVolumesWithApplications operation, unable to list stateful sets across the cluster. Error: %w", err)
		}
		statefulSetItems = statefulSets.Items
	}

	hasDaemonSetOwnerReference := containsDaemonSetOwnerReference(pods)
	daemonSetItems := make([]appsv1.DaemonSet, 0)
	if hasDaemonSetOwnerReference {
		daemonSets, err := kcl.cli.AppsV1().DaemonSets("").List(context.Background(), metav1.ListOptions{})
		if err != nil {
			log.Error().Err(err).Msg("Failed to list daemon sets across the cluster")
			return nil, fmt.Errorf("an error occurred during the CombineVolumesWithApplications operation, unable to list daemon sets across the cluster. Error: %w", err)
		}
		daemonSetItems = daemonSets.Items
	}

	return kcl.updateVolumesWithOwningApplications(volumes, pods, deploymentItems, replicaSetItems, statefulSetItems, daemonSetItems)
}

// updateVolumesWithOwningApplications updates the volumes with the applications that use them.
func (kcl *KubeClient) updateVolumesWithOwningApplications(volumes *[]models.K8sVolumeInfo, pods *corev1.PodList, deploymentItems []appsv1.Deployment, replicaSetItems []appsv1.ReplicaSet, statefulSetItems []appsv1.StatefulSet, daemonSetItems []appsv1.DaemonSet) (*[]models.K8sVolumeInfo, error) {
	for i, volume := range *volumes {
		for _, pod := range pods.Items {
			if pod.Spec.Volumes != nil {
				for _, podVolume := range pod.Spec.Volumes {
					if podVolume.VolumeSource.PersistentVolumeClaim != nil && podVolume.VolumeSource.PersistentVolumeClaim.ClaimName == volume.PersistentVolumeClaim.Name && pod.Namespace == volume.PersistentVolumeClaim.Namespace {
						application, err := kcl.ConvertPodToApplication(pod, PortainerApplicationResources{
							ReplicaSets:  replicaSetItems,
							Deployments:  deploymentItems,
							StatefulSets: statefulSetItems,
							DaemonSets:   daemonSetItems,
						}, false)
						if err != nil {
							log.Error().Err(err).Msg("Failed to convert pod to application")
							return nil, fmt.Errorf("an error occurred during the CombineServicesWithApplications operation, unable to convert pod to application. Error: %w", err)
						}
						// Check if the application already exists in the OwningApplications slice
						exists := false
						for _, existingApp := range (*volumes)[i].PersistentVolumeClaim.OwningApplications {
							if existingApp.Name == application.Name && existingApp.Namespace == application.Namespace {
								exists = true
								break
							}
						}
						if !exists && application != nil {
							(*volumes)[i].PersistentVolumeClaim.OwningApplications = append((*volumes)[i].PersistentVolumeClaim.OwningApplications, *application)
						}
					}
				}
			}
		}
	}
	return volumes, nil
}
