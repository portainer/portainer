package cli

import (
	"context"
	"fmt"
	"time"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetConfigMaps gets all the ConfigMaps for a given namespace in a k8s endpoint.
// if the user is an admin, all configMaps in the current k8s environment(endpoint) are fetched using the fetchConfigMaps function.
// otherwise, namespaces the non-admin user has access to will be used to filter the configMaps based on the allowed namespaces.
func (kcl *KubeClient) GetConfigMaps(namespace string) ([]models.K8sConfigMap, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchConfigMaps(namespace)
	}
	return kcl.fetchConfigMapsForNonAdmin(namespace)
}

// fetchConfigMapsForNonAdmin fetches the configMaps in the namespaces the user has access to.
// This function is called when the user is not an admin.
func (kcl *KubeClient) fetchConfigMapsForNonAdmin(namespace string) ([]models.K8sConfigMap, error) {
	log.Debug().Msgf("Fetching configMaps for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
		return nil, nil
	}

	configMaps, err := kcl.fetchConfigMaps(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sConfigMap, 0)
	for _, configMap := range configMaps {
		if _, ok := nonAdminNamespaceSet[configMap.Namespace]; ok {
			results = append(results, configMap)
		}
	}

	return results, nil
}

// fetchConfigMaps gets all the ConfigMaps for a given namespace in a k8s endpoint.
// the result is a list of config maps parsed into a K8sConfigMap struct.
func (kcl *KubeClient) fetchConfigMaps(namespace string) ([]models.K8sConfigMap, error) {
	configMaps, err := kcl.cli.CoreV1().ConfigMaps(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := []models.K8sConfigMap{}
	for _, configMap := range configMaps.Items {
		results = append(results, parseConfigMap(&configMap, false))
	}

	return results, nil
}

func (kcl *KubeClient) GetConfigMap(namespace, configMapName string) (models.K8sConfigMap, error) {
	configMap, err := kcl.cli.CoreV1().ConfigMaps(namespace).Get(context.Background(), configMapName, metav1.GetOptions{})
	if err != nil {
		return models.K8sConfigMap{}, err
	}

	return parseConfigMap(configMap, true), nil
}

// parseConfigMap parses a k8s ConfigMap object into a K8sConfigMap struct.
// for get operation, withData will be set to true.
// otherwise, only metadata will be parsed.
func parseConfigMap(configMap *corev1.ConfigMap, withData bool) models.K8sConfigMap {
	result := models.K8sConfigMap{
		K8sConfiguration: models.K8sConfiguration{
			UID:                  string(configMap.UID),
			Name:                 configMap.Name,
			Namespace:            configMap.Namespace,
			CreationDate:         configMap.CreationTimestamp.Time.UTC().Format(time.RFC3339),
			Annotations:          configMap.Annotations,
			Labels:               configMap.Labels,
			ConfigurationOwner:   configMap.Labels[labelPortainerKubeConfigOwner],
			ConfigurationOwnerId: configMap.Labels[labelPortainerKubeConfigOwnerId],
		},
	}

	if withData {
		result.Data = configMap.Data
	}

	return result
}

// CombineConfigMapsWithApplications combines the config maps with the applications that use them.
// the function fetches all the pods and replica sets in the cluster and checks if the config map is used by any of the pods.
// if the config map is used by a pod, the application that uses the pod is added to the config map.
// otherwise, the config map is returned as is.
func (kcl *KubeClient) CombineConfigMapsWithApplications(configMaps []models.K8sConfigMap) ([]models.K8sConfigMap, error) {
	updatedConfigMaps := make([]models.K8sConfigMap, len(configMaps))

	portainerApplicationResources, err := kcl.fetchAllApplicationsListResources("", metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("an error occurred during the CombineConfigMapsWithApplications operation, unable to fetch pods and replica sets. Error: %w", err)
	}

	for index, configMap := range configMaps {
		updatedConfigMap := configMap

		applicationConfigurationOwners, err := kcl.GetApplicationConfigurationOwnersFromConfigMap(configMap, portainerApplicationResources.Pods, portainerApplicationResources.ReplicaSets)
		if err != nil {
			return nil, fmt.Errorf("an error occurred during the CombineConfigMapsWithApplications operation, unable to get applications from config map. Error: %w", err)
		}

		if len(applicationConfigurationOwners) > 0 {
			updatedConfigMap.ConfigurationOwnerResources = applicationConfigurationOwners
			updatedConfigMap.IsUsed = true
		}

		updatedConfigMaps[index] = updatedConfigMap
	}

	return updatedConfigMaps, nil
}

// CombineConfigMapWithApplications combines the config map with the applications that use it.
// the function fetches all the pods in the cluster and checks if the config map is used by any of the pods.
// it needs to check if the pods are owned by a replica set to determine if the pod is part of a deployment.
func (kcl *KubeClient) CombineConfigMapWithApplications(configMap models.K8sConfigMap) (models.K8sConfigMap, error) {
	pods, err := kcl.cli.CoreV1().Pods(configMap.Namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return models.K8sConfigMap{}, fmt.Errorf("an error occurred during the CombineConfigMapWithApplications operation, unable to get pods. Error: %w", err)
	}

	containsReplicaSetOwner := false
	for _, pod := range pods.Items {
		containsReplicaSetOwner = isReplicaSetOwner(pod)
		break
	}

	if containsReplicaSetOwner {
		replicaSets, err := kcl.cli.AppsV1().ReplicaSets(configMap.Namespace).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return models.K8sConfigMap{}, fmt.Errorf("an error occurred during the CombineConfigMapWithApplications operation, unable to get replica sets. Error: %w", err)
		}

		applicationConfigurationOwners, err := kcl.GetApplicationConfigurationOwnersFromConfigMap(configMap, pods.Items, replicaSets.Items)
		if err != nil {
			return models.K8sConfigMap{}, fmt.Errorf("an error occurred during the CombineConfigMapWithApplications operation, unable to get applications from config map. Error: %w", err)
		}

		if len(applicationConfigurationOwners) > 0 {
			configMap.ConfigurationOwnerResources = applicationConfigurationOwners
		}
	}

	return configMap, nil
}
