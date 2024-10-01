package cli

import (
	"context"
	"fmt"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

// GetServices gets all the services for either at the cluster level or a given namespace in a k8s endpoint.
// It returns a list of K8sServiceInfo objects.
func (kcl *KubeClient) GetServices(namespace string) ([]models.K8sServiceInfo, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchServices(namespace)
	}
	return kcl.fetchServicesForNonAdmin(namespace)
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
func parseService(service corev1.Service) models.K8sServiceInfo {
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
		CreationDate:                  service.GetCreationTimestamp().String(),
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
func (kcl *KubeClient) convertToK8sService(info models.K8sServiceInfo) corev1.Service {
	service := corev1.Service{}
	service.Name = info.Name
	service.Spec.Type = corev1.ServiceType(info.Type)
	service.Namespace = info.Namespace
	service.Annotations = info.Annotations
	service.Labels = info.Labels
	service.Spec.AllocateLoadBalancerNodePorts = info.AllocateLoadBalancerNodePorts
	service.Spec.Selector = info.Selector

	for _, p := range info.Ports {
		port := corev1.ServicePort{}
		port.Name = p.Name
		port.NodePort = int32(p.NodePort)
		port.Port = int32(p.Port)
		port.Protocol = corev1.Protocol(p.Protocol)
		port.TargetPort = intstr.FromString(p.TargetPort)
		service.Spec.Ports = append(service.Spec.Ports, port)
	}

	for _, i := range info.IngressStatus {
		service.Status.LoadBalancer.Ingress = append(
			service.Status.LoadBalancer.Ingress,
			corev1.LoadBalancerIngress{IP: i.IP, Hostname: i.Host},
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
// if replicasets are found, it updates the owner reference to deployment
// it then combines the service with the application
// finally, it returns a list of K8sServiceInfo objects
func (kcl *KubeClient) CombineServicesWithApplications(services []models.K8sServiceInfo) ([]models.K8sServiceInfo, error) {
	if containsServiceWithSelector(services) {
		updatedServices := make([]models.K8sServiceInfo, len(services))
		pods, replicaSets, _, _, _, _, err := kcl.fetchAllPodsAndReplicaSets("", metav1.ListOptions{})
		if err != nil {
			return nil, fmt.Errorf("an error occurred during the CombineServicesWithApplications operation, unable to fetch pods and replica sets. Error: %w", err)
		}

		for index, service := range services {
			updatedService := service

			application, err := kcl.GetApplicationFromServiceSelector(pods, service, replicaSets)
			if err != nil {
				return services, fmt.Errorf("an error occurred during the CombineServicesWithApplications operation, unable to get application from service. Error: %w", err)
			}

			if application != nil {
				updatedService.Applications = append(updatedService.Applications, *application)
			}

			updatedServices[index] = updatedService
		}

		return updatedServices, nil
	}

	return services, nil
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
