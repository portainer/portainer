package cli

import (
	"context"
	"fmt"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	labels "k8s.io/apimachinery/pkg/labels"
)

// GetAllKubernetesApplications gets a list of kubernetes workloads (or applications) across all namespaces in the cluster
// if the user is an admin, all namespaces in the current k8s environment(endpoint) are fetched using the fetchApplications function.
// otherwise, namespaces the non-admin user has access to will be used to filter the applications based on the allowed namespaces.
func (kcl *KubeClient) GetApplications(namespace, nodeName string, withDependencies bool) ([]models.K8sApplication, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchApplications(namespace, nodeName, withDependencies)
	}

	return kcl.fetchApplicationsForNonAdmin(namespace, nodeName, withDependencies)
}

// fetchApplications fetches the applications in the namespaces the user has access to.
// This function is called when the user is an admin.
func (kcl *KubeClient) fetchApplications(namespace, nodeName string, withDependencies bool) ([]models.K8sApplication, error) {
	podListOptions := metav1.ListOptions{}
	if nodeName != "" {
		podListOptions.FieldSelector = fmt.Sprintf("spec.nodeName=%s", nodeName)
	}
	if !withDependencies {
		// TODO: make sure not to fetch services in fetchAllApplicationsListResources from this call
		pods, replicaSets, deployments, statefulSets, daemonSets, _, err := kcl.fetchAllApplicationsListResources(namespace, podListOptions)
		if err != nil {
			return nil, err
		}

		return kcl.convertPodsToApplications(pods, replicaSets, deployments, statefulSets, daemonSets, nil)
	}

	pods, replicaSets, deployments, statefulSets, daemonSets, services, err := kcl.fetchAllApplicationsListResources(namespace, podListOptions)
	if err != nil {
		return nil, err
	}

	return kcl.convertPodsToApplications(pods, replicaSets, deployments, statefulSets, daemonSets, services)
}

// fetchApplicationsForNonAdmin fetches the applications in the namespaces the user has access to.
// This function is called when the user is not an admin.
func (kcl *KubeClient) fetchApplicationsForNonAdmin(namespace, nodeName string, withDependencies bool) ([]models.K8sApplication, error) {
	log.Debug().Msgf("Fetching applications for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
		return nil, nil
	}

	podListOptions := metav1.ListOptions{}
	if nodeName != "" {
		podListOptions.FieldSelector = fmt.Sprintf("spec.nodeName=%s", nodeName)
	}

	if !withDependencies {
		pods, replicaSets, _, _, _, _, err := kcl.fetchAllPodsAndReplicaSets(namespace, podListOptions)
		if err != nil {
			return nil, err
		}

		return kcl.convertPodsToApplications(pods, replicaSets, nil, nil, nil, nil)
	}

	pods, replicaSets, deployments, statefulSets, daemonSets, services, err := kcl.fetchAllApplicationsListResources(namespace, podListOptions)
	if err != nil {
		return nil, err
	}

	applications, err := kcl.convertPodsToApplications(pods, replicaSets, deployments, statefulSets, daemonSets, services)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sApplication, 0)
	for _, application := range applications {
		if _, ok := nonAdminNamespaceSet[application.ResourcePool]; ok {
			results = append(results, application)
		}
	}

	return results, nil
}

// convertPodsToApplications processes pods and converts them to applications, ensuring uniqueness by owner reference.
func (kcl *KubeClient) convertPodsToApplications(pods []corev1.Pod, replicaSets []appsv1.ReplicaSet, deployments []appsv1.Deployment, statefulSets []appsv1.StatefulSet, daemonSets []appsv1.DaemonSet, services []corev1.Service) ([]models.K8sApplication, error) {
	applications := []models.K8sApplication{}
	processedOwners := make(map[string]struct{})

	for _, pod := range pods {
		if len(pod.OwnerReferences) > 0 {
			ownerUID := string(pod.OwnerReferences[0].UID)
			if _, exists := processedOwners[ownerUID]; exists {
				continue
			}
			processedOwners[ownerUID] = struct{}{}
		}

		application, err := kcl.ConvertPodToApplication(pod, replicaSets, deployments, statefulSets, daemonSets, services, true)
		if err != nil {
			return nil, err
		}

		if application != nil {
			applications = append(applications, *application)
		}
	}

	return applications, nil
}

// GetClusterApplicationsResource returns the total resource requests and limits for all applications in a namespace
// for a cluster level resource, set the namespace to ""
func (kcl *KubeClient) GetApplicationsResource(namespace, node string) (models.K8sApplicationResource, error) {
	resource := models.K8sApplicationResource{}
	podListOptions := metav1.ListOptions{}
	if node != "" {
		podListOptions.FieldSelector = fmt.Sprintf("spec.nodeName=%s", node)
	}

	pods, err := kcl.cli.CoreV1().Pods(namespace).List(context.Background(), podListOptions)
	if err != nil {
		return resource, err
	}

	for _, pod := range pods.Items {
		for _, container := range pod.Spec.Containers {
			resource.CPURequest += float64(container.Resources.Requests.Cpu().MilliValue())
			resource.CPULimit += float64(container.Resources.Limits.Cpu().MilliValue())
			resource.MemoryRequest += container.Resources.Requests.Memory().Value()
			resource.MemoryLimit += container.Resources.Limits.Memory().Value()
		}
	}

	return resource, nil
}

// convertApplicationResourceUnits converts the resource units from milli to core and bytes to mega bytes
func convertApplicationResourceUnits(resource models.K8sApplicationResource) models.K8sApplicationResource {
	return models.K8sApplicationResource{
		CPURequest:    resource.CPURequest / 1000,
		CPULimit:      resource.CPULimit / 1000,
		MemoryRequest: resource.MemoryRequest / 1024 / 1024,
		MemoryLimit:   resource.MemoryLimit / 1024 / 1024,
	}
}

// GetApplicationsFromConfigMap gets a list of applications that use a specific ConfigMap
// by checking all pods in the same namespace as the ConfigMap
func (kcl *KubeClient) GetApplicationNamesFromConfigMap(configMap models.K8sConfigMap, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]string, error) {
	applications := []string{}
	for _, pod := range pods {
		if pod.Namespace == configMap.Namespace {
			if isPodUsingConfigMap(&pod, configMap.Name) {
				application, err := kcl.ConvertPodToApplication(pod, replicaSets, nil, nil, nil, nil, false)
				if err != nil {
					return nil, err
				}
				applications = append(applications, application.Name)
			}
		}
	}

	return applications, nil
}

func (kcl *KubeClient) GetApplicationNamesFromSecret(secret models.K8sSecret, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]string, error) {
	applications := []string{}
	for _, pod := range pods {
		if pod.Namespace == secret.Namespace {
			if isPodUsingSecret(&pod, secret.Name) {
				application, err := kcl.ConvertPodToApplication(pod, replicaSets, nil, nil, nil, nil, false)
				if err != nil {
					return nil, err
				}
				applications = append(applications, application.Name)
			}
		}
	}

	return applications, nil
}

// ConvertPodToApplication converts a pod to an application, updating owner references if necessary
func (kcl *KubeClient) ConvertPodToApplication(pod corev1.Pod, replicaSets []appsv1.ReplicaSet, deployments []appsv1.Deployment, statefulSets []appsv1.StatefulSet, daemonSets []appsv1.DaemonSet, services []corev1.Service, withResource bool) (*models.K8sApplication, error) {
	if isReplicaSetOwner(pod) {
		updateOwnerReferenceToDeployment(&pod, replicaSets)
	}

	application := createApplication(&pod, deployments, statefulSets, daemonSets, services)
	if application.ID == "" && application.Name == "" {
		return nil, nil
	}

	if withResource {
		application.Resource = calculateResourceUsage(pod)
	}

	return &application, nil
}

// createApplication creates a K8sApplication object from a pod
// it sets the application name, namespace, kind, image, stack id, stack name, and labels
func createApplication(pod *corev1.Pod, deployments []appsv1.Deployment, statefulSets []appsv1.StatefulSet, daemonSets []appsv1.DaemonSet, services []corev1.Service) models.K8sApplication {
	kind := "Pod"
	name := pod.Name

	if len(pod.OwnerReferences) > 0 {
		kind = pod.OwnerReferences[0].Kind
		name = pod.OwnerReferences[0].Name
	}

	application := models.K8sApplication{
		Services: []corev1.Service{},
		Metadata: &models.Metadata{},
	}

	switch kind {
	case "Deployment":
		for _, deployment := range deployments {
			if deployment.Name == name && deployment.Namespace == pod.Namespace {
				application.ApplicationType = "Deployment"
				application.Kind = "Deployment"
				application.ID = string(deployment.UID)
				application.ResourcePool = deployment.Namespace
				application.Name = name
				application.Image = deployment.Spec.Template.Spec.Containers[0].Image
				application.ApplicationOwner = deployment.Labels["io.portainer.kubernetes.application.owner"]
				application.StackID = deployment.Labels["io.portainer.kubernetes.application.stackid"]
				application.StackName = deployment.Labels["io.portainer.kubernetes.application.stack"]
				application.Labels = deployment.Labels
				application.MatchLabels = deployment.Spec.Selector.MatchLabels
				application.CreationDate = deployment.CreationTimestamp.Time
				application.TotalPodsCount = int(deployment.Status.Replicas)
				application.RunningPodsCount = int(deployment.Status.ReadyReplicas)
				application.DeploymentType = "Replicated"
				application.Metadata = &models.Metadata{
					Labels: deployment.Labels,
				}

				break
			}
		}

	case "StatefulSet":
		for _, statefulSet := range statefulSets {
			if statefulSet.Name == name && statefulSet.Namespace == pod.Namespace {
				application.Kind = "StatefulSet"
				application.ApplicationType = "StatefulSet"
				application.ID = string(statefulSet.UID)
				application.ResourcePool = statefulSet.Namespace
				application.Name = name
				application.Image = statefulSet.Spec.Template.Spec.Containers[0].Image
				application.ApplicationOwner = statefulSet.Labels["io.portainer.kubernetes.application.owner"]
				application.StackID = statefulSet.Labels["io.portainer.kubernetes.application.stackid"]
				application.StackName = statefulSet.Labels["io.portainer.kubernetes.application.stack"]
				application.Labels = statefulSet.Labels
				application.MatchLabels = statefulSet.Spec.Selector.MatchLabels
				application.CreationDate = statefulSet.CreationTimestamp.Time
				application.TotalPodsCount = int(statefulSet.Status.Replicas)
				application.RunningPodsCount = int(statefulSet.Status.ReadyReplicas)
				application.DeploymentType = "Replicated"
				application.Metadata = &models.Metadata{
					Labels: statefulSet.Labels,
				}

				break
			}
		}

	case "DaemonSet":
		for _, daemonSet := range daemonSets {
			if daemonSet.Name == name && daemonSet.Namespace == pod.Namespace {
				application.Kind = "DaemonSet"
				application.ApplicationType = "DaemonSet"
				application.ID = string(daemonSet.UID)
				application.ResourcePool = daemonSet.Namespace
				application.Name = name
				application.Image = daemonSet.Spec.Template.Spec.Containers[0].Image
				application.ApplicationOwner = daemonSet.Labels["io.portainer.kubernetes.application.owner"]
				application.StackID = daemonSet.Labels["io.portainer.kubernetes.application.stackid"]
				application.StackName = daemonSet.Labels["io.portainer.kubernetes.application.stack"]
				application.Labels = daemonSet.Labels
				application.MatchLabels = daemonSet.Spec.Selector.MatchLabels
				application.CreationDate = daemonSet.CreationTimestamp.Time
				application.TotalPodsCount = int(daemonSet.Status.DesiredNumberScheduled)
				application.RunningPodsCount = int(daemonSet.Status.NumberReady)
				application.DeploymentType = "Global"
				application.Metadata = &models.Metadata{
					Labels: daemonSet.Labels,
				}

				break
			}
		}

	case "Pod":
		runningPodsCount := 1
		if pod.Status.Phase != corev1.PodRunning {
			runningPodsCount = 0
		}

		application.ApplicationType = "Pod"
		application.Kind = "Pod"
		application.ID = string(pod.UID)
		application.ResourcePool = pod.Namespace
		application.Name = pod.Name
		application.Image = pod.Spec.Containers[0].Image
		application.ApplicationOwner = pod.Labels["io.portainer.kubernetes.application.owner"]
		application.StackID = pod.Labels["io.portainer.kubernetes.application.stackid"]
		application.StackName = pod.Labels["io.portainer.kubernetes.application.stack"]
		application.Labels = pod.Labels
		application.MatchLabels = pod.Labels
		application.CreationDate = pod.CreationTimestamp.Time
		application.TotalPodsCount = 1
		application.RunningPodsCount = runningPodsCount
		application.DeploymentType = string(pod.Status.Phase)
		application.Metadata = &models.Metadata{
			Labels: pod.Labels,
		}
	}

	if application.ID != "" && application.Name != "" && len(services) > 0 {
		return updateApplicationWithService(application, services)
	}

	return application
}

// updateApplicationWithService updates the application with the services that match the application's selector match labels
// and are in the same namespace as the application
func updateApplicationWithService(application models.K8sApplication, services []corev1.Service) models.K8sApplication {
	for _, service := range services {
		serviceSelector := labels.SelectorFromSet(service.Spec.Selector)

		if service.Namespace == application.ResourcePool && serviceSelector.Matches(labels.Set(application.MatchLabels)) {
			application.ServiceType = string(service.Spec.Type)
			application.Services = append(application.Services, service)
		}
	}

	return application
}

// calculateResourceUsage calculates the resource usage for a pod
func calculateResourceUsage(pod corev1.Pod) models.K8sApplicationResource {
	resource := models.K8sApplicationResource{}
	for _, container := range pod.Spec.Containers {
		resource.CPURequest += float64(container.Resources.Requests.Cpu().MilliValue())
		resource.CPULimit += float64(container.Resources.Limits.Cpu().MilliValue())
		resource.MemoryRequest += container.Resources.Requests.Memory().Value()
		resource.MemoryLimit += container.Resources.Limits.Memory().Value()
	}
	return convertApplicationResourceUnits(resource)
}

// GetApplicationFromServiceSelector gets applications based on service selectors
// it matches the service selector with the pod labels
func (kcl *KubeClient) GetApplicationFromServiceSelector(pods []corev1.Pod, service models.K8sServiceInfo, replicaSets []appsv1.ReplicaSet) (*models.K8sApplication, error) {
	servicesSelector := labels.SelectorFromSet(service.Selector)
	if servicesSelector.Empty() {
		return nil, nil
	}

	for _, pod := range pods {
		if servicesSelector.Matches(labels.Set(pod.Labels)) {
			if isReplicaSetOwner(pod) {
				updateOwnerReferenceToDeployment(&pod, replicaSets)
			}

			return &models.K8sApplication{
				Name: pod.OwnerReferences[0].Name,
				Kind: pod.OwnerReferences[0].Kind,
			}, nil
		}
	}

	return nil, nil
}

// GetApplicationConfigurationOwnersFromConfigMap gets a list of applications that use a specific ConfigMap
// by checking all pods in the same namespace as the ConfigMap
func (kcl *KubeClient) GetApplicationConfigurationOwnersFromConfigMap(configMap models.K8sConfigMap, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]models.K8sConfigurationOwnerResource, error) {
	configurationOwners := []models.K8sConfigurationOwnerResource{}
	for _, pod := range pods {
		if pod.Namespace == configMap.Namespace {
			if isPodUsingConfigMap(&pod, configMap.Name) {
				application, err := kcl.ConvertPodToApplication(pod, replicaSets, nil, nil, nil, nil, false)
				if err != nil {
					return nil, err
				}

				if application != nil {
					configurationOwners = append(configurationOwners, models.K8sConfigurationOwnerResource{
						Name:         application.Name,
						ResourceKind: application.Kind,
						Id:           application.UID,
					})
				}
			}
		}
	}

	return configurationOwners, nil
}

// GetApplicationConfigurationOwnersFromSecret gets a list of applications that use a specific Secret
// by checking all pods in the same namespace as the Secret
func (kcl *KubeClient) GetApplicationConfigurationOwnersFromSecret(secret models.K8sSecret, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]models.K8sConfigurationOwnerResource, error) {
	configurationOwners := []models.K8sConfigurationOwnerResource{}
	for _, pod := range pods {
		if pod.Namespace == secret.Namespace {
			if isPodUsingSecret(&pod, secret.Name) {
				application, err := kcl.ConvertPodToApplication(pod, replicaSets, nil, nil, nil, nil, false)
				if err != nil {
					return nil, err
				}

				if application != nil {
					configurationOwners = append(configurationOwners, models.K8sConfigurationOwnerResource{
						Name:         application.Name,
						ResourceKind: application.Kind,
						Id:           application.UID,
					})
				}
			}
		}
	}

	return configurationOwners, nil
}
