package cli

import (
	"context"
	"fmt"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"

	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

// GetServices gets all the services for either at the cluster level or a given namespace in a k8s endpoint.
// It returns a list of K8sServiceInfo objects.
func (kcl *KubeClient) GetServices(namespace string) ([]models.K8sServiceInfo, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchServicesForAdmin(namespace)
	}
	return kcl.fetchServicesForNonAdmin(namespace)
}

// fetchServicesForAdmin gets all the services for either at the cluster level or a given namespace in a k8s endpoint.
// it returns a list of K8sServiceInfo objects.
func (kcl *KubeClient) fetchServicesForAdmin(namespace string) ([]models.K8sServiceInfo, error) {
	return kcl.fetchServices(namespace)
}

// fetchServicesForNonAdmin gets all the services for either at the cluster level or a given namespace in a k8s endpoint.
// the namespace will be coming from NonAdminNamespaces as non-admin users are restricted to certain namespaces.
// it returns a list of K8sServiceInfo objects.
func (kcl *KubeClient) fetchServicesForNonAdmin(namespace string) ([]models.K8sServiceInfo, error) {
	log.Debug().Msgf("Fetching services for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
		return nil, nil
	}

	services, err := kcl.fetchServices(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sServiceInfo, 0)
	for _, service := range services {
		if _, ok := nonAdminNamespaceSet[service.Namespace]; ok {
			results = append(results, service)
		}
	}

	return results, nil
}

// fetchServices gets the services in a given namespace in a k8s endpoint.
// It returns a list of K8sServiceInfo objects.
func (kcl *KubeClient) fetchServices(namespace string) ([]models.K8sServiceInfo, error) {
	services, err := kcl.cli.CoreV1().Services(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sServiceInfo, 0)
	for _, service := range services.Items {
		results = append(results, parseService(service))
	}

	return results, nil
}

// parseService converts a k8s native service object to a Portainer K8sServiceInfo object.
// service ports, ingress status, labels, annotations, cluster IPs, and external IPs are parsed.
// it returns a K8sServiceInfo object.
func parseService(service v1.Service) models.K8sServiceInfo {
	servicePorts := make([]models.K8sServicePort, 0)
	for _, port := range service.Spec.Ports {
		servicePorts = append(servicePorts, models.K8sServicePort{
			Name:       port.Name,
			NodePort:   int(port.NodePort),
			Port:       int(port.Port),
			Protocol:   string(port.Protocol),
			TargetPort: port.TargetPort.String(),
		})
	}

	ingressStatus := make([]models.K8sServiceIngress, 0)
	for _, status := range service.Status.LoadBalancer.Ingress {
		ingressStatus = append(ingressStatus, models.K8sServiceIngress{
			IP:   status.IP,
			Host: status.Hostname,
		})
	}

	return models.K8sServiceInfo{
		Name:                          service.Name,
		UID:                           string(service.GetUID()),
		Type:                          string(service.Spec.Type),
		Namespace:                     service.Namespace,
		CreationTimestamp:             service.GetCreationTimestamp().String(),
		AllocateLoadBalancerNodePorts: service.Spec.AllocateLoadBalancerNodePorts,
		Ports:                         servicePorts,
		IngressStatus:                 ingressStatus,
		Labels:                        service.GetLabels(),
		Annotations:                   service.GetAnnotations(),
		ClusterIPs:                    service.Spec.ClusterIPs,
		ExternalName:                  service.Spec.ExternalName,
		ExternalIPs:                   service.Spec.ExternalIPs,
		Selector:                      service.Spec.Selector,
	}
}

// convertToK8sService converts a K8sServiceInfo object back to a k8s native service object.
// this is required for create and update operations.
// it returns a v1.Service object.
func (kcl *KubeClient) convertToK8sService(info models.K8sServiceInfo) v1.Service {
	service := v1.Service{}
	service.Name = info.Name
	service.Spec.Type = v1.ServiceType(info.Type)
	service.Namespace = info.Namespace
	service.Annotations = info.Annotations
	service.Labels = info.Labels
	service.Spec.AllocateLoadBalancerNodePorts = info.AllocateLoadBalancerNodePorts
	service.Spec.Selector = info.Selector

	for _, p := range info.Ports {
		port := v1.ServicePort{}
		port.Name = p.Name
		port.NodePort = int32(p.NodePort)
		port.Port = int32(p.Port)
		port.Protocol = v1.Protocol(p.Protocol)
		port.TargetPort = intstr.FromString(p.TargetPort)
		service.Spec.Ports = append(service.Spec.Ports, port)
	}

	for _, i := range info.IngressStatus {
		service.Status.LoadBalancer.Ingress = append(
			service.Status.LoadBalancer.Ingress,
			v1.LoadBalancerIngress{IP: i.IP, Hostname: i.Host},
		)
	}

	return service
}

// CreateService creates a new service in a given namespace in a k8s endpoint.
func (kcl *KubeClient) CreateService(namespace string, info models.K8sServiceInfo) error {
	service := kcl.convertToK8sService(info)
	_, err := kcl.cli.CoreV1().Services(namespace).Create(context.Background(), &service, metav1.CreateOptions{})
	return err
}

// DeleteServices processes a K8sServiceDeleteRequest by deleting each service
// in its given namespace.
func (kcl *KubeClient) DeleteServices(reqs models.K8sServiceDeleteRequests) error {
	for namespace := range reqs {
		for _, service := range reqs[namespace] {
			err := kcl.cli.CoreV1().Services(namespace).Delete(context.Background(), service, metav1.DeleteOptions{})
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// UpdateService updates service in a given namespace in a k8s endpoint.
func (kcl *KubeClient) UpdateService(namespace string, info models.K8sServiceInfo) error {
	service := kcl.convertToK8sService(info)
	_, err := kcl.cli.CoreV1().Services(namespace).Update(context.Background(), &service, metav1.UpdateOptions{})
	return err
}

// CombineServicesWithApplications retrieves applications based on service selectors in a given namespace
// for all services, it lists pods based on the service selector and converts the pod to an application
// it then combines the service with the application
// finally, it returns a list of K8sServiceInfo objects
func (kcl *KubeClient) CombineServicesWithApplications(services *[]models.K8sServiceInfo) ([]models.K8sServiceInfo, error) {
	hasSelectors := containsServiceWithSelector(*services)
	if hasSelectors {
		pods, err := kcl.cli.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
		if err != nil {
			if k8serrors.IsNotFound(err) {
				return *services, nil
			}
			return nil, fmt.Errorf("an error occurred during the CombineServicesWithApplications operation, unable to list pods across the cluster. Error: %w", err)
		}

		hasReplicaSetOwnerReference := containsReplicaSetOwnerReference(pods)
		replicaSetItems := make([]appsv1.ReplicaSet, 0)
		if hasReplicaSetOwnerReference {
			replicaSets, err := kcl.cli.AppsV1().ReplicaSets("").List(context.Background(), metav1.ListOptions{})
			if err != nil {
				return nil, fmt.Errorf("an error occurred during the GetApplicationsFromServiceSelectors operation, unable to list replica sets across the cluster. Error: %w", err)
			}
			replicaSetItems = replicaSets.Items
		}

		for index, service := range *services {
			application, err := kcl.GetApplicationFromServiceSelector(pods, service, replicaSetItems)
			if err != nil {
				return nil, fmt.Errorf("an error occurred during the CombineServicesWithApplications operation, unable to get application from service. Error: %w", err)
			}

			if application.Name != "" {
				(*services)[index].Applications = append((*services)[index].Applications, application)
			}
		}
	}

	return *services, nil
}

// containsServiceWithSelector checks if a list of services contains a service with a selector
// it returns true if any service has a selector, otherwise false
func containsServiceWithSelector(services []models.K8sServiceInfo) bool {
	for _, service := range services {
		if len(service.Selector) > 0 {
			return true
		}
	}
	return false
}

// buildServicesMap builds a map of service names from a list of K8sServiceInfo objects
// it returns a map of service names for lookups
func (kcl *KubeClient) buildServicesMap(services []models.K8sServiceInfo) map[string]struct{} {
	serviceMap := make(map[string]struct{})
	for _, service := range services {
		serviceMap[service.Name] = struct{}{}
	}
	return serviceMap
}
