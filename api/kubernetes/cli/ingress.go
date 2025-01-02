package cli

import (
	"context"
	"fmt"
	"strings"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/rs/zerolog/log"
	netv1 "k8s.io/api/networking/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (kcl *KubeClient) GetIngressControllers() (models.K8sIngressControllers, error) {
	classeses, err := kcl.cli.NetworkingV1().IngressClasses().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	ingresses, err := kcl.GetIngresses("")
	if err != nil {
		return nil, err
	}

	usedClasses := make(map[string]struct{})
	for _, ingress := range ingresses {
		usedClasses[ingress.ClassName] = struct{}{}
	}

	results := []models.K8sIngressController{}
	for _, class := range classeses.Items {
		ingressClass := parseIngressClass(class)
		if _, ok := usedClasses[class.Name]; ok {
			ingressClass.Used = true
		}

		results = append(results, ingressClass)
	}

	return results, nil
}

// fetchIngressClasses fetches all the ingress classes in a k8s endpoint.
func (kcl *KubeClient) fetchIngressClasses() ([]models.K8sIngressController, error) {
	ingressClasses, err := kcl.cli.NetworkingV1().IngressClasses().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var controllers []models.K8sIngressController
	for _, ingressClass := range ingressClasses.Items {
		controllers = append(controllers, parseIngressClass(ingressClass))
	}
	return controllers, nil
}

// parseIngressClass converts a k8s native ingress class object to a Portainer K8sIngressController object.
func parseIngressClass(ingressClasses netv1.IngressClass) models.K8sIngressController {
	ingressContoller := models.K8sIngressController{
		Name:      ingressClasses.Spec.Controller,
		ClassName: ingressClasses.Name,
	}

	switch {
	case strings.Contains(ingressContoller.Name, "nginx"):
		ingressContoller.Type = "nginx"
	case strings.Contains(ingressContoller.Name, "traefik"):
		ingressContoller.Type = "traefik"
	default:
		ingressContoller.Type = "other"
	}

	return ingressContoller
}

// GetIngress gets an ingress in a given namespace in a k8s endpoint.
func (kcl *KubeClient) GetIngress(namespace, ingressName string) (models.K8sIngressInfo, error) {
	ingress, err := kcl.cli.NetworkingV1().Ingresses(namespace).Get(context.Background(), ingressName, metav1.GetOptions{})
	if err != nil {
		return models.K8sIngressInfo{}, err
	}

	return parseIngress(*ingress), nil
}

// GetIngresses gets all the ingresses for a given namespace in a k8s endpoint.
func (kcl *KubeClient) GetIngresses(namespace string) ([]models.K8sIngressInfo, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchIngresses(namespace)
	}
	return kcl.fetchIngressesForNonAdmin(namespace)
}

// fetchIngressesForNonAdmin gets all the ingresses for non-admin users in a k8s endpoint.
func (kcl *KubeClient) fetchIngressesForNonAdmin(namespace string) ([]models.K8sIngressInfo, error) {
	log.Debug().Msgf("Fetching ingresses for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
		return nil, nil
	}

	ingresses, err := kcl.fetchIngresses(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sIngressInfo, 0)
	for _, ingress := range ingresses {
		if _, ok := nonAdminNamespaceSet[ingress.Namespace]; ok {
			results = append(results, ingress)
		}
	}

	return results, nil
}

// fetchIngresses fetches all the ingresses for a given namespace in a k8s endpoint.
func (kcl *KubeClient) fetchIngresses(namespace string) ([]models.K8sIngressInfo, error) {
	ingresses, err := kcl.cli.NetworkingV1().Ingresses(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	ingressClasses, err := kcl.fetchIngressClasses()
	if err != nil {
		return nil, err
	}

	results := []models.K8sIngressInfo{}
	if len(ingresses.Items) == 0 {
		return results, nil
	}

	for _, ingress := range ingresses.Items {
		result := parseIngress(ingress)
		if ingress.Spec.IngressClassName != nil {
			result.Type = findUsedIngressFromIngressClasses(ingressClasses, *ingress.Spec.IngressClassName).Name
		}
		results = append(results, result)
	}

	return results, nil
}

// parseIngress converts a k8s native ingress object to a Portainer K8sIngressInfo object.
func parseIngress(ingress netv1.Ingress) models.K8sIngressInfo {
	ingressClassName := ""
	if ingress.Spec.IngressClassName != nil {
		ingressClassName = *ingress.Spec.IngressClassName
	}

	result := models.K8sIngressInfo{
		Name:         ingress.Name,
		Namespace:    ingress.Namespace,
		UID:          string(ingress.UID),
		Annotations:  ingress.Annotations,
		Labels:       ingress.Labels,
		CreationDate: ingress.CreationTimestamp.Time,
		ClassName:    ingressClassName,
	}

	for _, tls := range ingress.Spec.TLS {
		result.TLS = append(result.TLS, models.K8sIngressTLS{
			Hosts:      tls.Hosts,
			SecretName: tls.SecretName,
		})
	}

	hosts := make(map[string]struct{})
	for _, r := range ingress.Spec.Rules {
		hosts[r.Host] = struct{}{}

		if r.HTTP == nil {
			continue
		}
		for _, p := range r.HTTP.Paths {
			var path models.K8sIngressPath
			path.IngressName = result.Name
			path.Host = r.Host

			path.Path = p.Path
			if p.PathType != nil {
				path.PathType = string(*p.PathType)
			}
			path.ServiceName = p.Backend.Service.Name
			path.Port = int(p.Backend.Service.Port.Number)
			result.Paths = append(result.Paths, path)
		}
	}

	for host := range hosts {
		result.Hosts = append(result.Hosts, host)
	}

	return result
}

// findUsedIngressFromIngressClasses searches for an ingress in a slice of ingress classes and returns the ingress if found.
func findUsedIngressFromIngressClasses(ingressClasses []models.K8sIngressController, className string) models.K8sIngressController {
	for _, ingressClass := range ingressClasses {
		if ingressClass.ClassName == className {
			return ingressClass
		}
	}

	return models.K8sIngressController{}
}

// CreateIngress creates a new ingress in a given namespace in a k8s endpoint.
func (kcl *KubeClient) CreateIngress(namespace string, info models.K8sIngressInfo, owner string) error {
	ingress := kcl.convertToK8sIngress(info, owner)
	_, err := kcl.cli.NetworkingV1().Ingresses(namespace).Create(context.Background(), &ingress, metav1.CreateOptions{})
	if err != nil {
		return err
	}

	return nil
}

// convertToK8sIngress converts a Portainer K8sIngressInfo object to a k8s native Ingress object.
// this is required for create and update operations.
func (kcl *KubeClient) convertToK8sIngress(info models.K8sIngressInfo, owner string) netv1.Ingress {
	ingressSpec := netv1.IngressSpec{}
	if info.ClassName != "" {
		ingressSpec.IngressClassName = &info.ClassName
	}

	result := netv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:        info.Name,
			Namespace:   info.Namespace,
			Annotations: info.Annotations,
		},

		Spec: ingressSpec,
	}

	labels := make(map[string]string)
	labels["io.portainer.kubernetes.ingress.owner"] = stackutils.SanitizeLabel(owner)
	result.Labels = labels

	tls := []netv1.IngressTLS{}
	for _, t := range info.TLS {
		tls = append(tls, netv1.IngressTLS{
			Hosts:      t.Hosts,
			SecretName: t.SecretName,
		})
	}
	result.Spec.TLS = tls

	rules := make(map[string][]netv1.HTTPIngressPath)
	for _, path := range info.Paths {
		pathType := netv1.PathType(path.PathType)
		rules[path.Host] = append(rules[path.Host], netv1.HTTPIngressPath{
			Path:     path.Path,
			PathType: &pathType,
			Backend: netv1.IngressBackend{
				Service: &netv1.IngressServiceBackend{
					Name: path.ServiceName,
					Port: netv1.ServiceBackendPort{
						Number: int32(path.Port),
					},
				},
			},
		})
	}

	for rule, paths := range rules {
		result.Spec.Rules = append(result.Spec.Rules, netv1.IngressRule{
			Host: rule,
			IngressRuleValue: netv1.IngressRuleValue{
				HTTP: &netv1.HTTPIngressRuleValue{
					Paths: paths,
				},
			},
		})
	}

	for _, host := range info.Hosts {
		if _, ok := rules[host]; !ok {
			result.Spec.Rules = append(result.Spec.Rules, netv1.IngressRule{
				Host: host,
			})
		}
	}

	return result
}

// DeleteIngresses processes a K8sIngressDeleteRequest by deleting each ingress
// in its given namespace.
func (kcl *KubeClient) DeleteIngresses(reqs models.K8sIngressDeleteRequests) error {
	for namespace := range reqs {
		for _, ingress := range reqs[namespace] {
			err := kcl.cli.NetworkingV1().Ingresses(namespace).Delete(
				context.Background(),
				ingress,
				metav1.DeleteOptions{},
			)

			if err != nil {
				return err
			}
		}
	}

	return nil
}

// UpdateIngress updates an existing ingress in a given namespace in a k8s endpoint.
func (kcl *KubeClient) UpdateIngress(namespace string, info models.K8sIngressInfo) error {
	ingress := kcl.convertToK8sIngress(info, "")
	_, err := kcl.cli.NetworkingV1().Ingresses(namespace).Update(context.Background(), &ingress, metav1.UpdateOptions{})
	if err != nil {
		return err
	}

	return nil
}

// CombineIngressWithService combines an ingress with a service that is being used by the ingress.
// this is required to display the service that is being used by the ingress in the UI edit view.
func (kcl *KubeClient) CombineIngressWithService(ingress models.K8sIngressInfo) (models.K8sIngressInfo, error) {
	services, err := kcl.GetServices(ingress.Namespace)
	if err != nil {
		return models.K8sIngressInfo{}, fmt.Errorf("an error occurred during the CombineIngressWithService operation, unable to retrieve services from the Kubernetes for a namespace level user. Error: %w", err)
	}

	serviceMap := kcl.buildServicesMap(services)
	for pathIndex, path := range ingress.Paths {
		if _, ok := serviceMap[path.ServiceName]; ok {
			ingress.Paths[pathIndex].HasService = true
		}
	}

	return ingress, nil
}

// CombineIngressesWithServices combines a list of ingresses with a list of services that are being used by the ingresses.
// this is required to display the services that are being used by the ingresses in the UI list view.
func (kcl *KubeClient) CombineIngressesWithServices(ingresses []models.K8sIngressInfo) ([]models.K8sIngressInfo, error) {
	services, err := kcl.GetServices("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			return nil, fmt.Errorf("an error occurred during the CombineIngressesWithServices operation, unauthorized access to the Kubernetes API. Error: %w", err)
		}

		return nil, fmt.Errorf("an error occurred during the CombineIngressesWithServices operation, unable to retrieve services from the Kubernetes for a cluster level user. Error: %w", err)
	}

	serviceMap := kcl.buildServicesMap(services)
	for ingressIndex, ingress := range ingresses {
		for pathIndex, path := range ingress.Paths {
			if _, ok := serviceMap[path.ServiceName]; ok {
				(ingresses)[ingressIndex].Paths[pathIndex].HasService = true
			}
		}
	}

	return ingresses, nil
}
