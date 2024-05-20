package cli

import (
	"context"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/internal/concurrent"

	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (kcl *KubeClient) GetDashboard() (models.K8sDashboard, error) {
	dashboardData := models.K8sDashboard{}

	// Get a list of all the namespaces first
	namespaces, err := kcl.cli.CoreV1().Namespaces().List(context.TODO(), v1.ListOptions{})
	if err != nil {
		return dashboardData, err
	}

	getNamespaceCounts := func(namespace string) concurrent.Func {
		return func(ctx context.Context) (interface{}, error) {
			data := models.K8sDashboard{}

			// apps (deployments, statefulsets, daemonsets)
			applicationCount, err := getApplicationsCount(ctx, kcl, namespace)
			// skip namespaces we're not allowed access to.  But don't return an error
			if err != nil {
				// skip namespaces we're not allowed access to.  But don't return an error
				if errors.IsForbidden(err) {
					return nil, nil
				}
				return nil, err
			}

			// get naked pods
			nakedPods, err := kcl.GetApplications(namespace, "nakedpods")
			if err != nil {
				return nil, err
			}
			data.ApplicationsCount = applicationCount + int64(len(nakedPods))

			// services
			serviceCount, err := getServicesCount(ctx, kcl, namespace)
			if err != nil {
				return nil, err
			}
			data.ServicesCount = serviceCount

			/// ingresses
			ingressesCount, err := getIngressesCount(ctx, kcl, namespace)
			if err != nil {
				return nil, err
			}
			data.IngressesCount = ingressesCount

			// configmaps
			configMapCount, err := getConfigMapsCount(ctx, kcl, namespace)
			if err != nil {
				return nil, err
			}
			data.ConfigMapsCount = configMapCount

			// secrets
			secretsCount, err := getSecretsCount(ctx, kcl, namespace)
			if err != nil {
				return nil, err
			}
			data.SecretsCount = secretsCount

			// volumes
			volumesCount, err := getVolumesCount(ctx, kcl, namespace)
			if err != nil {
				return nil, err
			}
			data.VolumesCount = volumesCount

			// count this namespace for the user
			data.NamespacesCount = 1

			return data, nil
		}
	}

	dashboardTasks := make([]concurrent.Func, 0)
	for _, ns := range namespaces.Items {
		dashboardTasks = append(dashboardTasks, getNamespaceCounts(ns.Name))
	}

	// Fetch all the data for each namespace concurrently
	results, err := concurrent.Run(context.TODO(), maxConcurrency, dashboardTasks...)
	if err != nil {
		return dashboardData, err
	}

	for i := range results {
		data, _ := results[i].Result.(models.K8sDashboard)
		dashboardData.NamespacesCount += data.NamespacesCount
		dashboardData.ApplicationsCount += data.ApplicationsCount
		dashboardData.ServicesCount += data.ServicesCount
		dashboardData.IngressesCount += data.IngressesCount
		dashboardData.ConfigMapsCount += data.ConfigMapsCount
		dashboardData.SecretsCount += data.SecretsCount
		dashboardData.VolumesCount += data.VolumesCount
	}

	return dashboardData, nil
}

// Get applications excluding nakedpods
func getApplicationsCount(ctx context.Context, kcl *KubeClient, namespace string) (int64, error) {
	options := v1.ListOptions{Limit: 1}

	// deployments
	deployments, err := kcl.cli.AppsV1().Deployments(namespace).List(ctx, options)
	if err != nil {
		return 0, err
	}

	count := int64(0)
	if len(deployments.Items) > 0 {
		count = 1
		remainingItemsCount := deployments.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount
		}
	}

	// StatefulSets
	statefulSets, err := kcl.cli.AppsV1().StatefulSets(namespace).List(ctx, options)
	if err != nil {
		return 0, err
	}

	if len(statefulSets.Items) > 0 {
		count += 1
		remainingItemsCount := statefulSets.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount
		}
	}

	// Daemonsets
	daemonsets, err := kcl.cli.AppsV1().DaemonSets(namespace).List(ctx, options)
	if err != nil {
		return 0, err
	}

	if len(daemonsets.Items) > 0 {
		count += 1
		remainingItemsCount := daemonsets.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount
		}
	}

	return count, nil
}

// Get the total count of services for the given namespace
func getServicesCount(ctx context.Context, kcl *KubeClient, namespace string) (int64, error) {
	options := v1.ListOptions{
		Limit: 1,
	}
	var count int64 = 0
	services, err := kcl.cli.CoreV1().Services(namespace).List(ctx, options)
	if err != nil {
		return 0, err
	}

	if len(services.Items) > 0 {
		count = 0
		remainingItemsCount := services.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count = *remainingItemsCount
		}
	}

	return count, nil
}

// Get the total count of ingresses for the given namespace
func getIngressesCount(ctx context.Context, kcl *KubeClient, namespace string) (int64, error) {
	ingresses, err := kcl.cli.NetworkingV1().Ingresses(namespace).List(ctx, v1.ListOptions{Limit: 1})
	if err != nil {
		return 0, err
	}

	count := int64(0)
	if len(ingresses.Items) > 0 {
		count = 1
		remainingItemsCount := ingresses.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count = *remainingItemsCount
		}
	}

	return count, nil
}

// Get the total count of configMaps for the given namespace
func getConfigMapsCount(ctx context.Context, kcl *KubeClient, namespace string) (int64, error) {
	configMaps, err := kcl.cli.CoreV1().ConfigMaps(namespace).List(ctx, v1.ListOptions{Limit: 1})
	if err != nil {
		return 0, err
	}

	count := int64(0)
	if len(configMaps.Items) > 0 {
		count = 1
		remainingItemsCount := configMaps.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count = *remainingItemsCount
		}
	}

	return count, nil
}

// Get the total count of secrets for the given namespace
func getSecretsCount(ctx context.Context, kcl *KubeClient, namespace string) (int64, error) {
	secrets, err := kcl.cli.CoreV1().Secrets(namespace).List(ctx, v1.ListOptions{Limit: 1})
	if err != nil {
		return 0, err
	}

	count := int64(0)
	if len(secrets.Items) > 0 {
		count = 1
		remainingItemsCount := secrets.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count = *remainingItemsCount
		}
	}

	return count, nil
}

// Get the total count of volumes for the given namespace
func getVolumesCount(ctx context.Context, kcl *KubeClient, namespace string) (int64, error) {
	volumes, err := kcl.cli.CoreV1().PersistentVolumeClaims(namespace).List(ctx, v1.ListOptions{Limit: 1})
	if err != nil {
		return 0, err
	}

	count := int64(0)
	if len(volumes.Items) > 0 {
		count = 1
		remainingItemsCount := volumes.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count = *remainingItemsCount
		}
	}

	return count, nil
}
