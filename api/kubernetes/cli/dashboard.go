package cli

import (
	"context"

	"github.com/portainer/portainer/api/concurrent"
	models "github.com/portainer/portainer/api/http/models/kubernetes"

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
		return func(ctx context.Context) (any, error) {
			data := models.K8sDashboard{}

			// apps (deployments, statefulsets, daemonsets)
			applicationCount, err := getApplicationsCount(ctx, kcl, namespace)
			if err != nil {
				// skip namespaces we're not allowed access to.  But don't return an error so that we
				// can still count the other namespaces.  Returning an error here will stop concurrent.Run
				if errors.IsForbidden(err) {
					return nil, nil
				}
				return nil, err
			}
			data.ApplicationsCount = applicationCount

			// services
			serviceCount, err := getServicesCount(ctx, kcl, namespace)
			if err != nil {
				return nil, err
			}
			data.ServicesCount = serviceCount

			// ingresses
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

	// Sum up the results
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
	count := int64(0)

	// deployments
	deployments, err := kcl.cli.AppsV1().Deployments(namespace).List(ctx, options)
	if err != nil {
		return 0, err
	}

	if len(deployments.Items) > 0 {
		count = 1 // first deployment
		remainingItemsCount := deployments.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount // add the remaining deployments if any
		}
	}

	// StatefulSets
	statefulSets, err := kcl.cli.AppsV1().StatefulSets(namespace).List(ctx, options)
	if err != nil {
		return 0, err
	}

	if len(statefulSets.Items) > 0 {
		count += 1 // + first statefulset
		remainingItemsCount := statefulSets.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount // add the remaining statefulsets if any
		}
	}

	// Daemonsets
	daemonsets, err := kcl.cli.AppsV1().DaemonSets(namespace).List(ctx, options)
	if err != nil {
		return 0, err
	}

	if len(daemonsets.Items) > 0 {
		count += 1 // + first daemonset
		remainingItemsCount := daemonsets.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount // add the remaining daemonsets if any
		}
	}

	// + (naked pods)
	// TODO: Implement fetching of naked pods
	// This is to be reworked as part of the dashboard refactor

	// nakedPods, err := kcl.GetApplications(namespace, "nakedpods")
	// if err != nil {
	// 	return 0, err
	// }
	// For now, we're not including naked pods in the count

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
		count = 1 // first service
		remainingItemsCount := services.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount // add the remaining services if any
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
		count = 1 // first ingress
		remainingItemsCount := ingresses.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount // add the remaining ingresses if any
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
		count = 1 // first configmap
		remainingItemsCount := configMaps.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount // add the remaining configmaps if any
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
		count = 1 // first secret
		remainingItemsCount := secrets.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount // add the remaining secrets if any
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
		count = 1 // first volume
		remainingItemsCount := volumes.GetRemainingItemCount()
		if remainingItemsCount != nil {
			count += *remainingItemsCount // add the remaining volumes if any
		}
	}

	return count, nil
}
