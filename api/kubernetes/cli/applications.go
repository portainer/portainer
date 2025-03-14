package cli

import (
	"context"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	appsv1 "k8s.io/api/apps/v1"
	autoscalingv2 "k8s.io/api/autoscaling/v2"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	labels "k8s.io/apimachinery/pkg/labels"
)

// PortainerApplicationResources contains collections of various Kubernetes resources
// associated with a Portainer application.
type PortainerApplicationResources struct {
	Pods                     []corev1.Pod
	ReplicaSets              []appsv1.ReplicaSet
	Deployments              []appsv1.Deployment
	StatefulSets             []appsv1.StatefulSet
	DaemonSets               []appsv1.DaemonSet
	Services                 []corev1.Service
	HorizontalPodAutoscalers []autoscalingv2.HorizontalPodAutoscaler
}

// GetAllKubernetesApplications gets a list of kubernetes workloads (or applications) across all namespaces in the cluster
// if the user is an admin, all namespaces in the current k8s environment(endpoint) are fetched using the fetchApplications function.
// otherwise, namespaces the non-admin user has access to will be used to filter the applications based on the allowed namespaces.
func (kcl *KubeClient) GetApplications(namespace, nodeName string) ([]models.K8sApplication, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchApplications(namespace, nodeName)
	}

	return kcl.fetchApplicationsForNonAdmin(namespace, nodeName)
}

// fetchApplications fetches the applications in the namespaces the user has access to.
// This function is called when the user is an admin.
func (kcl *KubeClient) fetchApplications(namespace, nodeName string) ([]models.K8sApplication, error) {
	podListOptions := metav1.ListOptions{}
	if nodeName != "" {
		podListOptions.FieldSelector = "spec.nodeName=" + nodeName
	}

	portainerApplicationResources, err := kcl.fetchAllApplicationsListResources(namespace, podListOptions)
	if err != nil {
		return nil, err
	}

	applications, err := kcl.convertPodsToApplications(portainerApplicationResources)
	if err != nil {
		return nil, err
	}

	unhealthyApplications, err := fetchUnhealthyApplications(portainerApplicationResources)
	if err != nil {
		return nil, err
	}

	return append(applications, unhealthyApplications...), nil
}

// fetchApplicationsForNonAdmin fetches the applications in the namespaces the user has access to.
// This function is called when the user is not an admin.
func (kcl *KubeClient) fetchApplicationsForNonAdmin(namespace, nodeName string) ([]models.K8sApplication, error) {
	log.Debug().Msgf("Fetching applications for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
		return nil, nil
	}

	podListOptions := metav1.ListOptions{}
	if nodeName != "" {
		podListOptions.FieldSelector = "spec.nodeName=" + nodeName
	}

	portainerApplicationResources, err := kcl.fetchAllApplicationsListResources(namespace, podListOptions)
	if err != nil {
		return nil, err
	}

	applications, err := kcl.convertPodsToApplications(portainerApplicationResources)
	if err != nil {
		return nil, err
	}

	unhealthyApplications, err := fetchUnhealthyApplications(portainerApplicationResources)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sApplication, 0)
	for _, application := range append(applications, unhealthyApplications...) {
		if _, ok := nonAdminNamespaceSet[application.ResourcePool]; ok {
			results = append(results, application)
		}
	}

	return results, nil
}

// convertPodsToApplications processes pods and converts them to applications, ensuring uniqueness by owner reference.
func (kcl *KubeClient) convertPodsToApplications(portainerApplicationResources PortainerApplicationResources) ([]models.K8sApplication, error) {
	applications := []models.K8sApplication{}
	processedOwners := make(map[string]struct{})

	for _, pod := range portainerApplicationResources.Pods {
		if len(pod.OwnerReferences) > 0 {
			ownerUID := string(pod.OwnerReferences[0].UID)
			if _, exists := processedOwners[ownerUID]; exists {
				continue
			}
			processedOwners[ownerUID] = struct{}{}
		}

		application, err := kcl.ConvertPodToApplication(pod, portainerApplicationResources, true)
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
		podListOptions.FieldSelector = "spec.nodeName=" + node
	}

	pods, err := kcl.cli.CoreV1().Pods(namespace).List(context.Background(), podListOptions)
	if err != nil {
		return resource, err
	}

	for _, pod := range pods.Items {
		podResources := calculatePodResourceUsage(pod)
		resource.CPURequest += podResources.CPURequest
		resource.CPULimit += podResources.CPULimit
		resource.MemoryRequest += podResources.MemoryRequest
		resource.MemoryLimit += podResources.MemoryLimit
	}

	return resource, nil
}

// GetApplicationsFromConfigMap gets a list of applications that use a specific ConfigMap
// by checking all pods in the same namespace as the ConfigMap
func (kcl *KubeClient) GetApplicationNamesFromConfigMap(configMap models.K8sConfigMap, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]string, error) {
	applications := []string{}
	for _, pod := range pods {
		if pod.Namespace == configMap.Namespace {
			if isPodUsingConfigMap(&pod, configMap.Name) {
				application, err := kcl.ConvertPodToApplication(pod, PortainerApplicationResources{
					ReplicaSets: replicaSets,
				}, false)
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
				application, err := kcl.ConvertPodToApplication(pod, PortainerApplicationResources{
					ReplicaSets: replicaSets,
				}, false)
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
func (kcl *KubeClient) ConvertPodToApplication(pod corev1.Pod, portainerApplicationResources PortainerApplicationResources, withResource bool) (*models.K8sApplication, error) {
	if isReplicaSetOwner(pod) {
		updateOwnerReferenceToDeployment(&pod, portainerApplicationResources.ReplicaSets)
	}

	application := createApplicationFromPod(&pod, portainerApplicationResources)
	if application.ID == "" && application.Name == "" {
		return nil, nil
	}

	if withResource {
		podResources := calculatePodResourceUsage(pod)
		// multiply by the number of requested pods in the application (not the running count)
		application.Resource.CPURequest = podResources.CPURequest * float64(application.TotalPodsCount)
		application.Resource.CPULimit = podResources.CPULimit * float64(application.TotalPodsCount)
		application.Resource.MemoryRequest = podResources.MemoryRequest * int64(application.TotalPodsCount)
		application.Resource.MemoryLimit = podResources.MemoryLimit * int64(application.TotalPodsCount)
	}

	return &application, nil
}

// createApplicationFromPod creates a K8sApplication object from a pod
// it sets the application name, namespace, kind, image, stack id, stack name, and labels
func createApplicationFromPod(pod *corev1.Pod, portainerApplicationResources PortainerApplicationResources) models.K8sApplication {
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
		for _, deployment := range portainerApplicationResources.Deployments {
			if deployment.Name == name && deployment.Namespace == pod.Namespace {
				populateApplicationFromDeployment(&application, deployment)
				break
			}
		}
	case "StatefulSet":
		for _, statefulSet := range portainerApplicationResources.StatefulSets {
			if statefulSet.Name == name && statefulSet.Namespace == pod.Namespace {
				populateApplicationFromStatefulSet(&application, statefulSet)
				break
			}
		}
	case "DaemonSet":
		for _, daemonSet := range portainerApplicationResources.DaemonSets {
			if daemonSet.Name == name && daemonSet.Namespace == pod.Namespace {
				populateApplicationFromDaemonSet(&application, daemonSet)
				break
			}
		}
	case "Pod":
		populateApplicationFromPod(&application, *pod)
	}

	if application.ID != "" && application.Name != "" && len(portainerApplicationResources.Services) > 0 {
		updateApplicationWithService(&application, portainerApplicationResources.Services)
	}

	if application.ID != "" && application.Name != "" && len(portainerApplicationResources.HorizontalPodAutoscalers) > 0 {
		updateApplicationWithHorizontalPodAutoscaler(&application, portainerApplicationResources.HorizontalPodAutoscalers)
	}

	return application
}

// createApplicationFromDeployment creates a K8sApplication from a Deployment
func createApplicationFromDeployment(deployment appsv1.Deployment) models.K8sApplication {
	var app models.K8sApplication
	populateApplicationFromDeployment(&app, deployment)
	return app
}

// createApplicationFromStatefulSet creates a K8sApplication from a StatefulSet
func createApplicationFromStatefulSet(statefulSet appsv1.StatefulSet) models.K8sApplication {
	var app models.K8sApplication
	populateApplicationFromStatefulSet(&app, statefulSet)
	return app
}

// createApplicationFromDaemonSet creates a K8sApplication from a DaemonSet
func createApplicationFromDaemonSet(daemonSet appsv1.DaemonSet) models.K8sApplication {
	var app models.K8sApplication
	populateApplicationFromDaemonSet(&app, daemonSet)
	return app
}

func populateApplicationFromDeployment(application *models.K8sApplication, deployment appsv1.Deployment) {
	application.ApplicationType = "Deployment"
	application.Kind = "Deployment"
	application.ID = string(deployment.UID)
	application.ResourcePool = deployment.Namespace
	application.Name = deployment.Name
	application.ApplicationOwner = deployment.Labels["io.portainer.kubernetes.application.owner"]
	application.StackID = deployment.Labels["io.portainer.kubernetes.application.stackid"]
	application.StackName = deployment.Labels["io.portainer.kubernetes.application.stack"]
	application.Labels = deployment.Labels
	application.MatchLabels = deployment.Spec.Selector.MatchLabels
	application.CreationDate = deployment.CreationTimestamp.Time
	application.TotalPodsCount = 0
	if deployment.Spec.Replicas != nil {
		application.TotalPodsCount = int(*deployment.Spec.Replicas)
	}
	application.RunningPodsCount = int(deployment.Status.ReadyReplicas)
	application.DeploymentType = "Replicated"
	application.Metadata = &models.Metadata{
		Labels: deployment.Labels,
	}

	// If the deployment has containers, use the first container's image
	if len(deployment.Spec.Template.Spec.Containers) > 0 {
		application.Image = deployment.Spec.Template.Spec.Containers[0].Image
	}
}

func populateApplicationFromStatefulSet(application *models.K8sApplication, statefulSet appsv1.StatefulSet) {
	application.Kind = "StatefulSet"
	application.ApplicationType = "StatefulSet"
	application.ID = string(statefulSet.UID)
	application.ResourcePool = statefulSet.Namespace
	application.Name = statefulSet.Name
	application.ApplicationOwner = statefulSet.Labels["io.portainer.kubernetes.application.owner"]
	application.StackID = statefulSet.Labels["io.portainer.kubernetes.application.stackid"]
	application.StackName = statefulSet.Labels["io.portainer.kubernetes.application.stack"]
	application.Labels = statefulSet.Labels
	application.MatchLabels = statefulSet.Spec.Selector.MatchLabels
	application.CreationDate = statefulSet.CreationTimestamp.Time
	application.TotalPodsCount = 0
	if statefulSet.Spec.Replicas != nil {
		application.TotalPodsCount = int(*statefulSet.Spec.Replicas)
	}
	application.RunningPodsCount = int(statefulSet.Status.ReadyReplicas)
	application.DeploymentType = "Replicated"
	application.Metadata = &models.Metadata{
		Labels: statefulSet.Labels,
	}

	// If the statefulSet has containers, use the first container's image
	if len(statefulSet.Spec.Template.Spec.Containers) > 0 {
		application.Image = statefulSet.Spec.Template.Spec.Containers[0].Image
	}
}

func populateApplicationFromDaemonSet(application *models.K8sApplication, daemonSet appsv1.DaemonSet) {
	application.Kind = "DaemonSet"
	application.ApplicationType = "DaemonSet"
	application.ID = string(daemonSet.UID)
	application.ResourcePool = daemonSet.Namespace
	application.Name = daemonSet.Name
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

	if len(daemonSet.Spec.Template.Spec.Containers) > 0 {
		application.Image = daemonSet.Spec.Template.Spec.Containers[0].Image
	}
}

func populateApplicationFromPod(application *models.K8sApplication, pod corev1.Pod) {
	runningPodsCount := 1
	if pod.Status.Phase != corev1.PodRunning {
		runningPodsCount = 0
	}

	application.ApplicationType = "Pod"
	application.Kind = "Pod"
	application.ID = string(pod.UID)
	application.ResourcePool = pod.Namespace
	application.Name = pod.Name
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

	// If the pod has containers, use the first container's image
	if len(pod.Spec.Containers) > 0 {
		application.Image = pod.Spec.Containers[0].Image
	}
}

// updateApplicationWithService updates the application with the services that match the application's selector match labels
// and are in the same namespace as the application
func updateApplicationWithService(application *models.K8sApplication, services []corev1.Service) {
	for _, service := range services {
		serviceSelector := labels.SelectorFromSet(service.Spec.Selector)

		if service.Namespace == application.ResourcePool && !serviceSelector.Empty() && serviceSelector.Matches(labels.Set(application.MatchLabels)) {
			application.ServiceType = string(service.Spec.Type)
			application.Services = append(application.Services, service)
		}
	}
}

func updateApplicationWithHorizontalPodAutoscaler(application *models.K8sApplication, hpas []autoscalingv2.HorizontalPodAutoscaler) {
	for _, hpa := range hpas {
		// Check if HPA is in the same namespace as the application
		if hpa.Namespace != application.ResourcePool {
			continue
		}

		// Check if the scale target ref matches the application
		scaleTargetRef := hpa.Spec.ScaleTargetRef
		if scaleTargetRef.Name == application.Name && scaleTargetRef.Kind == application.Kind {
			hpaCopy := hpa // Create a local copy
			application.HorizontalPodAutoscaler = &hpaCopy
			break
		}
	}
}

// calculatePodResourceUsage calculates the resource usage for a pod in CPU cores and Bytes
func calculatePodResourceUsage(pod corev1.Pod) models.K8sApplicationResource {
	resource := models.K8sApplicationResource{}
	for _, container := range pod.Spec.Containers {
		// CPU cores as a decimal
		resource.CPURequest += float64(container.Resources.Requests.Cpu().MilliValue()) / 1000
		resource.CPULimit += float64(container.Resources.Limits.Cpu().MilliValue()) / 1000
		// Bytes
		resource.MemoryRequest += container.Resources.Requests.Memory().Value()
		resource.MemoryLimit += container.Resources.Limits.Memory().Value()
	}
	return resource
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
				application, err := kcl.ConvertPodToApplication(pod, PortainerApplicationResources{
					ReplicaSets: replicaSets,
				}, false)
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
				application, err := kcl.ConvertPodToApplication(pod, PortainerApplicationResources{
					ReplicaSets: replicaSets,
				}, false)
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

// fetchUnhealthyApplications fetches applications that failed to schedule any pods
// due to issues like missing resource limits or other scheduling constraints
func fetchUnhealthyApplications(resources PortainerApplicationResources) ([]models.K8sApplication, error) {
	var unhealthyApplications []models.K8sApplication

	// Process Deployments
	for _, deployment := range resources.Deployments {
		if hasNoScheduledPods(deployment) {
			app := createApplicationFromDeployment(deployment)
			addRelatedResourcesToApplication(&app, resources)
			unhealthyApplications = append(unhealthyApplications, app)
		}
	}

	// Process StatefulSets
	for _, statefulSet := range resources.StatefulSets {
		if hasNoScheduledPods(statefulSet) {
			app := createApplicationFromStatefulSet(statefulSet)
			addRelatedResourcesToApplication(&app, resources)
			unhealthyApplications = append(unhealthyApplications, app)
		}
	}

	// Process DaemonSets
	for _, daemonSet := range resources.DaemonSets {
		if hasNoScheduledPods(daemonSet) {
			app := createApplicationFromDaemonSet(daemonSet)
			addRelatedResourcesToApplication(&app, resources)
			unhealthyApplications = append(unhealthyApplications, app)
		}
	}

	return unhealthyApplications, nil
}

// addRelatedResourcesToApplication adds Services and HPA information to the application
func addRelatedResourcesToApplication(app *models.K8sApplication, resources PortainerApplicationResources) {
	if app.ID == "" || app.Name == "" {
		return
	}

	if len(resources.Services) > 0 {
		updateApplicationWithService(app, resources.Services)
	}

	if len(resources.HorizontalPodAutoscalers) > 0 {
		updateApplicationWithHorizontalPodAutoscaler(app, resources.HorizontalPodAutoscalers)
	}
}

// hasNoScheduledPods checks if a workload has completely failed to schedule any pods
// it checks for no replicas desired, i.e. nothing to schedule and see if any pods are running
// if any pods exist at all (even if not ready), it returns false
func hasNoScheduledPods(obj interface{}) bool {
	switch resource := obj.(type) {
	case appsv1.Deployment:
		if resource.Status.Replicas > 0 {
			return false
		}

		return resource.Status.ReadyReplicas == 0 && resource.Status.AvailableReplicas == 0

	case appsv1.StatefulSet:
		if resource.Status.Replicas > 0 {
			return false
		}

		return resource.Status.ReadyReplicas == 0 && resource.Status.CurrentReplicas == 0

	case appsv1.DaemonSet:
		if resource.Status.CurrentNumberScheduled > 0 || resource.Status.NumberMisscheduled > 0 {
			return false
		}

		return resource.Status.NumberReady == 0 && resource.Status.DesiredNumberScheduled > 0

	default:
		return false
	}
}
