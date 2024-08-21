package cli

import (
	"context"
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

// GetApplicationsFromConfigMap gets a list of applications that use a specific ConfigMap
// by checking all pods in the same namespace as the ConfigMap
func (kcl *KubeClient) GetApplicationNamesFromConfigMap(configMap models.K8sConfigMap, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]string, error) {
	results := []string{}
	for _, pod := range pods {
		if pod.Namespace == configMap.Namespace {
			if isPodUsingConfigMap(&pod, configMap.Name) {
				application, err := kcl.ConvertPodToApplication(pod, replicaSets)
				if err != nil {
					return nil, err
				}
				results = append(results, application.Name)
			}
		}
	}

	return results, nil
}

// ConvertPodToApplication converts a pod to an application, updating owner references if necessary
func (kcl *KubeClient) ConvertPodToApplication(pod corev1.Pod, replicaSets []appsv1.ReplicaSet) (models.K8sApplication, error) {
	if len(pod.OwnerReferences) == 0 {
		return createPodApplication(pod), nil
	}

	if isReplicaSetOwner(pod) {
		updateOwnerReferenceToDeployment(&pod, replicaSets)
	}

	return createApplicationFromOwnerReference(pod), nil
}

// createPodApplication creates a K8sApplication from a pod without owner references
func createPodApplication(pod corev1.Pod) models.K8sApplication {
	return models.K8sApplication{
		Name:      pod.Name,
		Namespace: pod.Namespace,
		Kind:      "Pod",
	}
}

// createApplicationFromOwnerReference creates a K8sApplication from the pod's owner reference
func createApplicationFromOwnerReference(pod corev1.Pod) models.K8sApplication {
	return models.K8sApplication{
		Name:      pod.OwnerReferences[0].Name,
		Namespace: pod.Namespace,
		Kind:      pod.OwnerReferences[0].Kind,
	}
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
			return kcl.ConvertPodToApplication(pod, replicaSets)
		}
	}

	return models.K8sApplication{}, nil
}

// ConvertPodToApplication converts a pod to an application, updating owner references if necessary
func (kcl *KubeClient) ConvertPodToApplication(pod corev1.Pod, replicaSets []appsv1.ReplicaSet) (models.K8sApplication, error) {
	if len(pod.OwnerReferences) == 0 {
		return createPodApplication(pod), nil
	}

	if isReplicaSetOwner(pod) {
		updateOwnerReferenceToDeployment(&pod, replicaSets)
	}

	return createApplicationFromOwnerReference(pod), nil
}

// createPodApplication creates a K8sApplication from a pod without owner references
func createPodApplication(pod corev1.Pod) models.K8sApplication {
	return models.K8sApplication{
		Name:      pod.Name,
		Namespace: pod.Namespace,
		Kind:      "Pod",
	}
}

// createApplicationFromOwnerReference creates a K8sApplication from the pod's owner reference
func createApplicationFromOwnerReference(pod corev1.Pod) models.K8sApplication {
	return models.K8sApplication{
		Name:      pod.OwnerReferences[0].Name,
		Namespace: pod.Namespace,
		Kind:      pod.OwnerReferences[0].Kind,
	}
}

// GetApplicationConfigurationOwnersFromConfigMap gets a list of applications that use a specific ConfigMap
// by checking all pods in the same namespace as the ConfigMap
func (kcl *KubeClient) GetApplicationConfigurationOwnersFromConfigMap(configMap models.K8sConfigMap, pods []corev1.Pod, replicaSets []appsv1.ReplicaSet) ([]models.K8sConfigurationOwners, error) {
	configurationOwners := []models.K8sConfigurationOwners{}
	for _, pod := range pods {
		if pod.Namespace == configMap.Namespace {
			if isPodUsingConfigMap(&pod, configMap.Name) {
				application, err := kcl.ConvertPodToApplication(pod, replicaSets)
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
				application, err := kcl.ConvertPodToApplication(pod, replicaSets)
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

// ConvertPodToApplication converts a pod to an application, updating owner references if necessary
func (kcl *KubeClient) ConvertPodToApplication(pod corev1.Pod, replicaSets []appsv1.ReplicaSet) (models.K8sApplication, error) {
	if len(pod.OwnerReferences) == 0 {
		return createPodApplication(pod), nil
	}

	if isReplicaSetOwner(pod) {
		updateOwnerReferenceToDeployment(&pod, replicaSets)
	}

	return createApplicationFromOwnerReference(pod), nil
}

// createPodApplication creates a K8sApplication from a pod without owner references
func createPodApplication(pod corev1.Pod) models.K8sApplication {
	return models.K8sApplication{
		Name:      pod.Name,
		Namespace: pod.Namespace,
		Kind:      "Pod",
		UID:       string(pod.UID),
	}
}

// createApplicationFromOwnerReference creates a K8sApplication from the pod's owner reference
func createApplicationFromOwnerReference(pod corev1.Pod) models.K8sApplication {
	return models.K8sApplication{
		Name:      pod.OwnerReferences[0].Name,
		Namespace: pod.Namespace,
		Kind:      pod.OwnerReferences[0].Kind,
		UID:       string(pod.OwnerReferences[0].UID),
	}
}
