package cli

import (
	"context"
	"fmt"
	"strconv"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	systemNamespaceLabel = "io.portainer.kubernetes.namespace.system"
)

func defaultSystemNamespaces() map[string]struct{} {
	return map[string]struct{}{
		"kube-system":     {},
		"kube-public":     {},
		"kube-node-lease": {},
		"portainer":       {},
	}
}

// GetNamespaces gets the namespaces in the current k8s environment(endpoint).
func (kcl *KubeClient) GetNamespaces() (map[string]portainer.K8sNamespaceInfo, error) {
	namespaces, err := kcl.cli.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make(map[string]portainer.K8sNamespaceInfo)

	for _, ns := range namespaces.Items {
		results[ns.Name] = portainer.K8sNamespaceInfo{
			IsSystem:  isSystemNamespace(ns),
			IsDefault: ns.Name == defaultNamespace,
		}
	}

	return results, nil
}

// GetNamespace gets the namespace in the current k8s environment(endpoint).
func (kcl *KubeClient) GetNamespace(name string) (portainer.K8sNamespaceInfo, error) {
	namespace, err := kcl.cli.CoreV1().Namespaces().Get(context.TODO(), name, metav1.GetOptions{})
	if err != nil {
		return portainer.K8sNamespaceInfo{}, err
	}

	result := portainer.K8sNamespaceInfo{
		IsSystem:  isSystemNamespace(*namespace),
		IsDefault: namespace.Name == defaultNamespace,
	}

	return result, nil
}

// CreateNamespace creates a new ingress in a given namespace in a k8s endpoint.
func (kcl *KubeClient) CreateNamespace(info models.K8sNamespaceDetails) error {
	portainerLabels := map[string]string{
		"io.portainer.kubernetes.resourcepool.name":  info.Name,
		"io.portainer.kubernetes.resourcepool.owner": info.Owner,
	}

	var ns v1.Namespace
	ns.Name = info.Name
	ns.Annotations = info.Annotations
	ns.Labels = portainerLabels

	_, err := kcl.cli.CoreV1().Namespaces().Create(context.Background(), &ns, metav1.CreateOptions{})
	if err != nil {
		log.Error().
			Err(err).
			Str("Namespace", info.Name).
			Msg("Failed to create the namespace")
		return err
	}

	if info.ResourceQuota != nil && info.ResourceQuota.Enabled {
		log.Info().Msgf("Creating resource quota for namespace %s", info.Name)
		log.Debug().Msgf("Creating resource quota with details: %+v", info.ResourceQuota)

		resourceQuota := &v1.ResourceQuota{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "portainer-rq-" + info.Name,
				Namespace: info.Name,
				Labels:    portainerLabels,
			},
			Spec: v1.ResourceQuotaSpec{
				Hard: v1.ResourceList{},
			},
		}

		if info.ResourceQuota.Enabled {
			memory := resource.MustParse(info.ResourceQuota.Memory)
			cpu := resource.MustParse(info.ResourceQuota.CPU)
			if memory.Value() > 0 {
				memQuota := memory
				resourceQuota.Spec.Hard[v1.ResourceLimitsMemory] = memQuota
				resourceQuota.Spec.Hard[v1.ResourceRequestsMemory] = memQuota
			}

			if cpu.Value() > 0 {
				cpuQuota := cpu
				resourceQuota.Spec.Hard[v1.ResourceLimitsCPU] = cpuQuota
				resourceQuota.Spec.Hard[v1.ResourceRequestsCPU] = cpuQuota
			}
		}

		_, err := kcl.cli.CoreV1().ResourceQuotas(info.Name).Create(context.Background(), resourceQuota, metav1.CreateOptions{})
		if err != nil {
			log.Error().Msgf("Failed to create resource quota for namespace %s: %s", info.Name, err)
			return err
		}
	}

	return nil
}

func isSystemNamespace(namespace v1.Namespace) bool {
	systemLabelValue, hasSystemLabel := namespace.Labels[systemNamespaceLabel]
	if hasSystemLabel {
		return systemLabelValue == "true"
	}

	systemNamespaces := defaultSystemNamespaces()

	_, isSystem := systemNamespaces[namespace.Name]

	return isSystem
}

// ToggleSystemState will set a namespace as a system namespace, or remove this state
// if isSystem is true it will set `systemNamespaceLabel` to "true" and false otherwise
// this will skip if namespace is "default" or if the required state is already set
func (kcl *KubeClient) ToggleSystemState(namespaceName string, isSystem bool) error {
	if namespaceName == "default" {
		return nil
	}

	nsService := kcl.cli.CoreV1().Namespaces()

	namespace, err := nsService.Get(context.TODO(), namespaceName, metav1.GetOptions{})
	if err != nil {
		return errors.Wrap(err, "failed fetching namespace object")
	}

	if isSystemNamespace(*namespace) == isSystem {
		return nil
	}

	if namespace.Labels == nil {
		namespace.Labels = map[string]string{}
	}

	namespace.Labels[systemNamespaceLabel] = strconv.FormatBool(isSystem)

	_, err = nsService.Update(context.TODO(), namespace, metav1.UpdateOptions{})
	if err != nil {
		return errors.Wrap(err, "failed updating namespace object")
	}

	if isSystem {
		return kcl.NamespaceAccessPoliciesDeleteNamespace(namespaceName)
	}

	return nil

}

// UpdateIngress updates an ingress in a given namespace in a k8s endpoint.
func (kcl *KubeClient) UpdateNamespace(info models.K8sNamespaceDetails) error {
	client := kcl.cli.CoreV1().Namespaces()

	var ns v1.Namespace
	ns.Name = info.Name
	ns.Annotations = info.Annotations

	_, err := client.Update(context.Background(), &ns, metav1.UpdateOptions{})
	return err
}

func (kcl *KubeClient) DeleteNamespace(namespace string) error {
	client := kcl.cli.CoreV1().Namespaces()
	namespaces, err := client.List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return err
	}

	for _, ns := range namespaces.Items {
		if ns.Name == namespace {
			return client.Delete(
				context.Background(),
				namespace,
				metav1.DeleteOptions{},
			)
		}
	}
	return fmt.Errorf("namespace %s not found", namespace)
}
