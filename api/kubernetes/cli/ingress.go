package cli

import (
	"context"
	"strings"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/rs/zerolog/log"
	netv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (kcl *KubeClient) GetIngressControllers() (models.K8sIngressControllers, error) {
	var controllers []models.K8sIngressController

	// We know that each existing class points to a controller so we can start
	// by collecting these easy ones.
	classClient := kcl.cli.NetworkingV1().IngressClasses()
	classList, err := classClient.List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// We want to know which of these controllers is in use.
	var ingresses []models.K8sIngressInfo
	namespaces, err := kcl.GetNamespaces()
	if err != nil {
		return nil, err
	}
	for namespace := range namespaces {
		t, err := kcl.GetIngresses(namespace)
		if err != nil {
			// User might not be able to list ingresses in system/not allowed
			// namespaces.
			log.Debug().Err(err).Msg("failed to list ingresses for the current user, skipped sending ingress")
			continue
		}
		ingresses = append(ingresses, t...)
	}
	usedClasses := make(map[string]struct{})
	for _, ingress := range ingresses {
		usedClasses[ingress.ClassName] = struct{}{}
	}

	for _, class := range classList.Items {
		var controller models.K8sIngressController
		controller.Name = class.Spec.Controller
		controller.ClassName = class.Name

		// If the class is used mark it as such.
		if _, ok := usedClasses[class.Name]; ok {
			controller.Used = true
		}

		switch {
		case strings.Contains(controller.Name, "nginx"):
			controller.Type = "nginx"
		case strings.Contains(controller.Name, "traefik"):
			controller.Type = "traefik"
		default:
			controller.Type = "other"
		}
		controllers = append(controllers, controller)
	}
	return controllers, nil
}

// GetIngresses gets all the ingresses for a given namespace in a k8s endpoint.
func (kcl *KubeClient) GetIngresses(namespace string) ([]models.K8sIngressInfo, error) {
	// Fetch ingress classes to build a map. We will later use the map to lookup
	// each ingresses "type".
	classes := make(map[string]string)
	classClient := kcl.cli.NetworkingV1().IngressClasses()
	classList, err := classClient.List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	for _, class := range classList.Items {
		// Write the ingress classes "type" to our map.
		classes[class.Name] = class.Spec.Controller
	}

	// Fetch each ingress.
	ingressClient := kcl.cli.NetworkingV1().Ingresses(namespace)
	ingressList, err := ingressClient.List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var infos []models.K8sIngressInfo
	for _, ingress := range ingressList.Items {
		var info models.K8sIngressInfo
		info.Name = ingress.Name
		info.UID = string(ingress.UID)
		info.Namespace = namespace
		ingressClass := ingress.Spec.IngressClassName
		info.ClassName = ""
		if ingressClass != nil {
			info.ClassName = *ingressClass
		}
		info.Type = classes[info.ClassName]
		info.Annotations = ingress.Annotations
		info.Labels = ingress.Labels
		info.CreationDate = ingress.CreationTimestamp.Time

		// Gather TLS information.
		for _, v := range ingress.Spec.TLS {
			var tls models.K8sIngressTLS
			tls.Hosts = v.Hosts
			tls.SecretName = v.SecretName
			info.TLS = append(info.TLS, tls)
		}

		// Gather list of paths and hosts.
		hosts := make(map[string]struct{})
		for _, r := range ingress.Spec.Rules {
			// We collect all exiting hosts in a map to avoid duplicates.
			// Then, later convert it to a slice for the frontend.
			hosts[r.Host] = struct{}{}

			if r.HTTP == nil {
				continue
			}

			// There are multiple paths per rule. We want to flatten the list
			// for our frontend.
			for _, p := range r.HTTP.Paths {
				var path models.K8sIngressPath
				path.IngressName = info.Name
				path.Host = r.Host

				path.Path = p.Path
				if p.PathType != nil {
					path.PathType = string(*p.PathType)
				}
				path.ServiceName = p.Backend.Service.Name
				path.Port = int(p.Backend.Service.Port.Number)
				info.Paths = append(info.Paths, path)
			}
		}

		// Store list of hosts.
		for host := range hosts {
			info.Hosts = append(info.Hosts, host)
		}

		infos = append(infos, info)
	}

	return infos, nil
}

// CreateIngress creates a new ingress in a given namespace in a k8s endpoint.
func (kcl *KubeClient) CreateIngress(namespace string, info models.K8sIngressInfo, owner string) error {
	ingressClient := kcl.cli.NetworkingV1().Ingresses(namespace)
	var ingress netv1.Ingress

	ingress.Name = info.Name
	ingress.Namespace = info.Namespace
	if info.ClassName != "" {
		ingress.Spec.IngressClassName = &info.ClassName
	}
	ingress.Annotations = info.Annotations
	if ingress.Labels == nil {
		ingress.Labels = make(map[string]string)
	}
	ingress.Labels["io.portainer.kubernetes.ingress.owner"] = stackutils.SanitizeLabel(owner)

	// Store TLS information.
	var tls []netv1.IngressTLS
	for _, i := range info.TLS {
		tls = append(tls, netv1.IngressTLS{
			Hosts:      i.Hosts,
			SecretName: i.SecretName,
		})
	}
	ingress.Spec.TLS = tls

	// Parse "paths" into rules with paths.
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
		ingress.Spec.Rules = append(ingress.Spec.Rules, netv1.IngressRule{
			Host: rule,
			IngressRuleValue: netv1.IngressRuleValue{
				HTTP: &netv1.HTTPIngressRuleValue{
					Paths: paths,
				},
			},
		})
	}

	// Add rules for hosts that does not have paths.
	// e.g. dafault ingress rule without path to support what we had in 2.15
	for _, host := range info.Hosts {
		if _, ok := rules[host]; !ok {
			ingress.Spec.Rules = append(ingress.Spec.Rules, netv1.IngressRule{
				Host: host,
			})
		}
	}

	_, err := ingressClient.Create(context.Background(), &ingress, metav1.CreateOptions{})
	return err
}

// DeleteIngresses processes a K8sIngressDeleteRequest by deleting each ingress
// in its given namespace.
func (kcl *KubeClient) DeleteIngresses(reqs models.K8sIngressDeleteRequests) error {
	var err error
	for namespace := range reqs {
		for _, ingress := range reqs[namespace] {
			ingressClient := kcl.cli.NetworkingV1().Ingresses(namespace)
			err = ingressClient.Delete(
				context.Background(),
				ingress,
				metav1.DeleteOptions{},
			)
		}
	}
	return err
}

// UpdateIngress updates an existing ingress in a given namespace in a k8s endpoint.
func (kcl *KubeClient) UpdateIngress(namespace string, info models.K8sIngressInfo) error {
	ingressClient := kcl.cli.NetworkingV1().Ingresses(namespace)
	var ingress netv1.Ingress

	ingress.Name = info.Name
	ingress.Namespace = info.Namespace
	if info.ClassName != "" {
		ingress.Spec.IngressClassName = &info.ClassName
	}
	ingress.Annotations = info.Annotations

	// Store TLS information.
	var tls []netv1.IngressTLS
	for _, i := range info.TLS {
		tls = append(tls, netv1.IngressTLS{
			Hosts:      i.Hosts,
			SecretName: i.SecretName,
		})
	}
	ingress.Spec.TLS = tls

	// Parse "paths" into rules with paths.
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
		ingress.Spec.Rules = append(ingress.Spec.Rules, netv1.IngressRule{
			Host: rule,
			IngressRuleValue: netv1.IngressRuleValue{
				HTTP: &netv1.HTTPIngressRuleValue{
					Paths: paths,
				},
			},
		})
	}

	// Add rules for hosts that does not have paths.
	// e.g. dafault ingress rule without path to support what we had in 2.15
	for _, host := range info.Hosts {
		if _, ok := rules[host]; !ok {
			ingress.Spec.Rules = append(ingress.Spec.Rules, netv1.IngressRule{
				Host: host,
			})
		}
	}

	_, err := ingressClient.Update(context.Background(), &ingress, metav1.UpdateOptions{})
	return err
}
