package cli

import (
	"context"
	"fmt"
	"strings"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	labels "k8s.io/apimachinery/pkg/labels"
)

// GetApplications gets a list of kubernetes workloads (or applications) by kind.  If Kind is not specified, gets the all
func (kcl *KubeClient) GetApplications(namespace, kind string) ([]models.K8sApplication, error) {
	applicationList := []models.K8sApplication{}
	listOpts := metav1.ListOptions{}

	if kind == "" || strings.EqualFold(kind, "deployment") {
		deployments, err := kcl.cli.AppsV1().Deployments(namespace).List(context.TODO(), listOpts)
		if err != nil {
			return nil, err
		}

		for _, d := range deployments.Items {
			applicationList = append(applicationList, models.K8sApplication{
				UID:       string(d.UID),
				Name:      d.Name,
				Namespace: d.Namespace,
				Kind:      "Deployment",
				Labels:    d.Labels,
			})
		}
	}

	if kind == "" || strings.EqualFold(kind, "statefulset") {
		statefulSets, err := kcl.cli.AppsV1().StatefulSets(namespace).List(context.TODO(), listOpts)
		if err != nil {
			return nil, err
		}

		for _, s := range statefulSets.Items {
			applicationList = append(applicationList, models.K8sApplication{
				UID:       string(s.UID),
				Name:      s.Name,
				Namespace: s.Namespace,
				Kind:      "StatefulSet",
				Labels:    s.Labels,
			})
		}
	}

	if kind == "" || strings.EqualFold(kind, "daemonset") {
		daemonSets, err := kcl.cli.AppsV1().DaemonSets(namespace).List(context.TODO(), listOpts)
		if err != nil {
			return nil, err
		}

		for _, d := range daemonSets.Items {
			applicationList = append(applicationList, models.K8sApplication{
				UID:       string(d.UID),
				Name:      d.Name,
				Namespace: d.Namespace,
				Kind:      "DaemonSet",
				Labels:    d.Labels,
			})
		}
	}

	if kind == "" || strings.EqualFold(kind, "nakedpods") {
		pods, _ := kcl.cli.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
		for _, pod := range pods.Items {
			naked := false
			if len(pod.OwnerReferences) == 0 {
				naked = true
			} else {
				managed := false
			loop:
				for _, ownerRef := range pod.OwnerReferences {
					switch ownerRef.Kind {
					case "Deployment", "DaemonSet", "ReplicaSet":
						managed = true
						break loop
					}
				}

				if !managed {
					naked = true
				}
			}

			if naked {
				applicationList = append(applicationList, models.K8sApplication{
					UID:       string(pod.UID),
					Name:      pod.Name,
					Namespace: pod.Namespace,
					Kind:      "Pod",
					Labels:    pod.Labels,
				})
			}
		}
	}

	return applicationList, nil
}

// GetApplication gets a kubernetes workload (application) by kind and name.  If Kind is not specified, gets the all
func (kcl *KubeClient) GetApplication(namespace, kind, name string) (models.K8sApplication, error) {

	opts := metav1.GetOptions{}

	switch strings.ToLower(kind) {
	case "deployment":
		d, err := kcl.cli.AppsV1().Deployments(namespace).Get(context.TODO(), name, opts)
		if err != nil {
			return models.K8sApplication{}, err
		}

		return models.K8sApplication{
			UID:       string(d.UID),
			Name:      d.Name,
			Namespace: d.Namespace,
			Kind:      "Deployment",
			Labels:    d.Labels,
		}, nil

	case "statefulset":
		s, err := kcl.cli.AppsV1().StatefulSets(namespace).Get(context.TODO(), name, opts)
		if err != nil {
			return models.K8sApplication{}, err
		}

		return models.K8sApplication{
			UID:       string(s.UID),
			Name:      s.Name,
			Namespace: s.Namespace,
			Kind:      "StatefulSet",
			Labels:    s.Labels,
		}, nil

	case "daemonset":
		d, err := kcl.cli.AppsV1().DaemonSets(namespace).Get(context.TODO(), name, opts)
		if err != nil {
			return models.K8sApplication{}, err
		}

		return models.K8sApplication{
			UID:       string(d.UID),
			Name:      d.Name,
			Namespace: d.Namespace,
			Kind:      "DaemonSet",
			Labels:    d.Labels,
		}, nil
	}

	return models.K8sApplication{}, nil
}

// GetApplicationsByNode gets a list of kubernetes workloads (or applications) by node name
func (kcl *KubeClient) GetApplicationsByNode(nodeName string) ([]models.K8sApplication, error) {
	applications := []models.K8sApplication{}
	pods, replicaSets, err := kcl.fetchAllPodsAndReplicaSets(&metav1.ListOptions{FieldSelector: fmt.Sprintf("spec.nodeName=%s", nodeName)})
	if err != nil {
		return nil, err
	}

	for _, pod := range pods {
		application, err := kcl.ConvertPodToApplication(pod, replicaSets, true)
		if err != nil {
			return nil, err
		}

		applications = append(applications, application)
	}

	return applications, nil
}

// GetClusterApplicationsResource returns the total resource requests and limits for all applications in a namespace
// for a cluster level resource, set the namespace to ""
func (kcl *KubeClient) GetApplicationsResource(namespace string) (models.K8sApplicationResource, error) {
	resource := models.K8sApplicationResource{}
	pods, err := kcl.cli.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return resource, err
	}

	for _, pod := range pods.Items {
		for _, container := range pod.Spec.Containers {
			resource.CPURequest += container.Resources.Requests.Cpu().MilliValue()
			resource.CPULimit += container.Resources.Limits.Cpu().MilliValue()
			resource.MemoryRequest += container.Resources.Requests.Memory().Value()
			resource.MemoryLimit += container.Resources.Limits.Memory().Value()
		}
	}

	return convertApplicationResourceUnits(resource), nil
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
				application, err := kcl.ConvertPodToApplication(pod, replicaSets, false)
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
				application, err := kcl.ConvertPodToApplication(pod, replicaSets, false)
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
func (kcl *KubeClient) ConvertPodToApplication(pod corev1.Pod, replicaSets []appsv1.ReplicaSet, withResource bool) (models.K8sApplication, error) {
	if isReplicaSetOwner(pod) {
		updateOwnerReferenceToDeployment(&pod, replicaSets)
	}

	application := createApplication(pod)
	if withResource {
		application.Resource = calculateResourceUsage(pod)
	}

	return application, nil
}

// createApplication creates a K8sApplication object from a pod
// it sets the application name, namespace, kind, image, stack id, stack name, and labels
func createApplication(pod corev1.Pod) models.K8sApplication {
	applicationName := pod.Name
	applicationKind := "Pod"

	if len(pod.OwnerReferences) != 0 {
		applicationName = pod.OwnerReferences[0].Name
		applicationKind = pod.OwnerReferences[0].Kind
	}

	return models.K8sApplication{
		Name:         applicationName,
		Namespace:    pod.Namespace,
		ResourcePool: pod.Namespace,
		Kind:         applicationKind,
		Image:        pod.Spec.Containers[0].Image,
		StackID:      pod.Labels["io.portainer.kubernetes.application.stackid"],
		StackName:    pod.Labels["io.portainer.kubernetes.application.stack"],
		Labels:       pod.Labels,
	}
}

// calculateResourceUsage calculates the resource usage for a pod
func calculateResourceUsage(pod corev1.Pod) models.K8sApplicationResource {
	resource := models.K8sApplicationResource{}
	for _, container := range pod.Spec.Containers {
		resource.CPURequest += container.Resources.Requests.Cpu().MilliValue()
		resource.CPULimit += container.Resources.Limits.Cpu().MilliValue()
		resource.MemoryRequest += container.Resources.Requests.Memory().Value()
		resource.MemoryLimit += container.Resources.Limits.Memory().Value()
	}
	return convertApplicationResourceUnits(resource)
}

// GetApplicationFromServiceSelector gets applications based on service selectors
// it matches the service selector with the pod labels
func (kcl *KubeClient) GetApplicationFromServiceSelector(pods []corev1.Pod, service models.K8sServiceInfo, replicaSets []appsv1.ReplicaSet) (models.K8sApplication, error) {
	servicesSelector := labels.SelectorFromSet(service.Selector)
	if servicesSelector.Empty() {
		return models.K8sApplication{}, nil
	}

	for _, pod := range pods {
		if servicesSelector.Matches(labels.Set(pod.Labels)) {
			return kcl.ConvertPodToApplication(pod, replicaSets, false)
		}
	}

	return models.K8sApplication{}, nil
}

// GetApplicationConfigurationOwnersFromConfigMap gets a list of applications that use a specific ConfigMap
// by checking all pods in the same namespace as the ConfigMap
func (kcl *KubeClient) GetApplicationConfigurationOwnersFromConfigMap(configMap models.K8sConfigMap, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]models.K8sConfigurationOwners, error) {
	configurationOwners := []models.K8sConfigurationOwners{}
	for _, pod := range pods {
		if pod.Namespace == configMap.Namespace {
			if isPodUsingConfigMap(&pod, configMap.Name) {
				application, err := kcl.ConvertPodToApplication(pod, replicaSets, false)
				if err != nil {
					return nil, err
				}

				configurationOwners = append(configurationOwners, models.K8sConfigurationOwners{
					ConfigurationOwner:   application.Name,
					K8sConfigurationKind: application.Kind,
					ConfigurationOwnerId: application.UID,
				})
			}
		}
	}

	return configurationOwners, nil
}

func (kcl *KubeClient) GetApplicationConfigurationOwnersFromSecret(secret models.K8sSecret, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]models.K8sConfigurationOwners, error) {
	configurationOwners := []models.K8sConfigurationOwners{}
	for _, pod := range pods {
		if pod.Namespace == secret.Namespace {
			if isPodUsingSecret(&pod, secret.Name) {
				application, err := kcl.ConvertPodToApplication(pod, replicaSets, false)
				if err != nil {
					return nil, err
				}

				configurationOwners = append(configurationOwners, models.K8sConfigurationOwners{
					ConfigurationOwner:   application.Name,
					K8sConfigurationKind: application.Kind,
					ConfigurationOwnerId: application.UID,
				})
			}
		}
	}

	return configurationOwners, nil
}
