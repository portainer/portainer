package cli

import (
	"context"
	"runtime"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/internal/concurrent"

	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (kcl *KubeClient) GetDashboard() (models.K8sDashboard, error) {
	defer func() {
		runtime.GC() // this function consumes a lot of memory. force free it asap
	}()

	dashboardData := models.K8sDashboard{}

	// Get a list of all the namespaces first
	namespaces, err := kcl.cli.CoreV1().Namespaces().List(context.TODO(), v1.ListOptions{})
	if err != nil {
		return dashboardData, err
	}

	getNamespaceCounts := func(namespace string) concurrent.Func {
		return func(ctx context.Context) (interface{}, error) {
			data := models.K8sDashboard{}

			apps, err := kcl.GetApplications(namespace, "")
			if err != nil {
				if errors.IsForbidden(err) {
					return nil, nil
				}

				return nil, err
			}
			data.ApplicationsCount = len(apps)

			services, err := kcl.GetServices(namespace, false)
			if err != nil {
				return nil, err
			}
			data.ServicesCount = len(services)

			ingresses, err := kcl.GetIngresses(namespace)
			if err != nil {
				return nil, err
			}
			data.IngressesCount = len(ingresses)

			count, err := getConfigMapCount(kcl, namespace)
			if err != nil {
				return nil, err
			}
			data.ConfigMapsCount = count

			secretClient := kcl.cli.CoreV1().Secrets(namespace)
			secrets, err := secretClient.List(context.Background(), v1.ListOptions{})
			if err != nil {
				return nil, err
			}
			data.SecretsCount = len(secrets.Items)

			volumesClient := kcl.cli.CoreV1().PersistentVolumeClaims(namespace)
			volumes, err := volumesClient.List(context.Background(), v1.ListOptions{})
			if err != nil {
				return nil, err
			}
			data.VolumesCount = len(volumes.Items)

			// Count this namespace as accessable for this user
			data.NamespacesCount = 1

			return data, nil
		}
	}

	dashboardTasks := make([]concurrent.Func, 0)
	for _, ns := range namespaces.Items {
		dashboardTasks = append(dashboardTasks, getNamespaceCounts(ns.Name))
	}

	// Fetch all the dashboard data concurrently
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

// Get the total count of configMaps for the given namespace
func getConfigMapCount(kcl *KubeClient, namespace string) (int, error) {
	options := v1.ListOptions{
		Limit: 50,
	}
	count := 0
	for {
		configMaps, err := kcl.cli.CoreV1().ConfigMaps(namespace).List(context.Background(), options)
		if err != nil {
			return count, err
		}
		count += len(configMaps.Items)
		if configMaps.Continue == "" {
			break
		}
		options.Continue = configMaps.Continue
	}
	return count, nil
}
