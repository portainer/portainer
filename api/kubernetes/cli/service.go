package cli

import (
	"context"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	labels "k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/util/intstr"
)

// GetServices gets all the services for a given namespace in a k8s endpoint.
func (kcl *KubeClient) GetServices(namespace string, lookupApplications bool) ([]models.K8sServiceInfo, error) {
	client := kcl.cli.CoreV1().Services(namespace)

	services, err := client.List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var result []models.K8sServiceInfo

	for _, service := range services.Items {
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

		var applications []models.K8sApplication
		if lookupApplications {
			applications, _ = kcl.getOwningApplication(namespace, service.Spec.Selector)
		}

		result = append(result, models.K8sServiceInfo{
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
			Applications:                  applications,
		})
	}

	return result, nil
}

// CreateService creates a new service in a given namespace in a k8s endpoint.
func (kcl *KubeClient) CreateService(namespace string, info models.K8sServiceInfo) error {
	ServiceClient := kcl.cli.CoreV1().Services(namespace)
	var service v1.Service

	service.Name = info.Name
	service.Spec.Type = v1.ServiceType(info.Type)
	service.Namespace = info.Namespace
	service.Annotations = info.Annotations
	service.Labels = info.Labels
	service.Spec.AllocateLoadBalancerNodePorts = info.AllocateLoadBalancerNodePorts
	service.Spec.Selector = info.Selector

	// Set ports.
	for _, p := range info.Ports {
		var port v1.ServicePort
		port.Name = p.Name
		port.NodePort = int32(p.NodePort)
		port.Port = int32(p.Port)
		port.Protocol = v1.Protocol(p.Protocol)
		port.TargetPort = intstr.FromString(p.TargetPort)
		service.Spec.Ports = append(service.Spec.Ports, port)
	}

	// Set ingresses.
	for _, i := range info.IngressStatus {
		var ing v1.LoadBalancerIngress
		ing.IP = i.IP
		ing.Hostname = i.Host
		service.Status.LoadBalancer.Ingress = append(
			service.Status.LoadBalancer.Ingress,
			ing,
		)
	}

	_, err := ServiceClient.Create(context.Background(), &service, metav1.CreateOptions{})
	return err
}

// DeleteServices processes a K8sServiceDeleteRequest by deleting each service
// in its given namespace.
func (kcl *KubeClient) DeleteServices(reqs models.K8sServiceDeleteRequests) error {
	var err error
	for namespace := range reqs {
		for _, service := range reqs[namespace] {
			serviceClient := kcl.cli.CoreV1().Services(namespace)
			err = serviceClient.Delete(
				context.Background(),
				service,
				metav1.DeleteOptions{},
			)
		}
	}
	return err
}

// UpdateService updates service in a given namespace in a k8s endpoint.
func (kcl *KubeClient) UpdateService(namespace string, info models.K8sServiceInfo) error {
	ServiceClient := kcl.cli.CoreV1().Services(namespace)
	var service v1.Service

	service.Name = info.Name
	service.Spec.Type = v1.ServiceType(info.Type)
	service.Namespace = info.Namespace
	service.Annotations = info.Annotations
	service.Labels = info.Labels
	service.Spec.AllocateLoadBalancerNodePorts = info.AllocateLoadBalancerNodePorts
	service.Spec.Selector = info.Selector

	// Set ports.
	for _, p := range info.Ports {
		var port v1.ServicePort
		port.Name = p.Name
		port.NodePort = int32(p.NodePort)
		port.Port = int32(p.Port)
		port.Protocol = v1.Protocol(p.Protocol)
		port.TargetPort = intstr.FromString(p.TargetPort)
		service.Spec.Ports = append(service.Spec.Ports, port)
	}

	// Set ingresses.
	for _, i := range info.IngressStatus {
		var ing v1.LoadBalancerIngress
		ing.IP = i.IP
		ing.Hostname = i.Host
		service.Status.LoadBalancer.Ingress = append(
			service.Status.LoadBalancer.Ingress,
			ing,
		)
	}

	_, err := ServiceClient.Update(context.Background(), &service, metav1.UpdateOptions{})
	return err
}

// getOwningApplication gets the application that owns the given service selector.
func (kcl *KubeClient) getOwningApplication(namespace string, selector map[string]string) ([]models.K8sApplication, error) {
	if len(selector) == 0 {
		return nil, nil
	}

	selectorLabels := labels.SelectorFromSet(selector).String()

	// look for replicasets first, limit 1 (we only support one owner)
	replicasets, err := kcl.cli.AppsV1().ReplicaSets(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: selectorLabels, Limit: 1})
	if err != nil {
		return nil, err
	}

	var meta metav1.Object
	if replicasets != nil && len(replicasets.Items) > 0 {
		meta = replicasets.Items[0].GetObjectMeta()
	} else {
		// otherwise look for matching pods, limit 1 (we only support one owner)
		pods, err := kcl.cli.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: selectorLabels, Limit: 1})
		if err != nil {
			return nil, err
		}

		if pods == nil || len(pods.Items) == 0 {
			return nil, nil
		}

		meta = pods.Items[0].GetObjectMeta()
	}

	return makeApplication(meta), nil
}

func makeApplication(meta metav1.Object) []models.K8sApplication {
	ownerReferences := meta.GetOwnerReferences()
	if len(ownerReferences) == 0 {
		return nil
	}

	// Currently, we only support one owner reference
	ownerReference := ownerReferences[0]
	return []models.K8sApplication{
		{
			// Only the name is used right now, but we can add more fields in the future
			Name: ownerReference.Name,
		},
	}

}
