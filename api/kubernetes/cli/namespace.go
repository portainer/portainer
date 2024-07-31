package cli

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/rs/zerolog/log"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	systemNamespaceLabel = "io.portainer.kubernetes.namespace.system"
	namespaceOwnerLabel  = "io.portainer.kubernetes.resourcepool.owner"
	namespaceNameLabel   = "io.portainer.kubernetes.resourcepool.name"
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
	if kcl.isKubeAdmin {
		return kcl.fetchNamespacesForAdmin()
	}
	return kcl.fetchNamespacesForNonAdmin()
}

// fetchNamespacesForAdmin gets the namespaces in the current k8s environment(endpoint) for the admin user.
// The kube client must have cluster scope read access to do this.
func (kcl *KubeClient) fetchNamespacesForAdmin() (map[string]portainer.K8sNamespaceInfo, error) {
	namespaces, err := kcl.cli.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces for the admin user: %w", err)
	}

	results := make(map[string]portainer.K8sNamespaceInfo)
	for _, namespace := range namespaces.Items {
		results[namespace.Name] = parseNamespace(&namespace)
	}
	return results, nil
}

// fetchNamespacesForNonAdmin gets the namespaces in the current k8s environment(endpoint) for the non-admin user.
func (kcl *KubeClient) fetchNamespacesForNonAdmin() (map[string]portainer.K8sNamespaceInfo, error) {
	results := make(map[string]portainer.K8sNamespaceInfo)
	log.Debug().Msgf("Fetching namespaces for non-admin user: %v", kcl.nonAdminNamespaces)
	if len(kcl.nonAdminNamespaces) > 0 {
		for _, ns := range kcl.nonAdminNamespaces {
			namespace, err := kcl.GetNamespace(ns)
			if err != nil {
				return nil, fmt.Errorf("failed to get namespace %s for the non-admin user: %w", ns, err)
			}
			results[ns] = namespace
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

	return parseNamespace(namespace), nil
}

// parseNamespace converts a k8s namespace object to a portainer namespace object.
func parseNamespace(namespace *v1.Namespace) portainer.K8sNamespaceInfo {
	return portainer.K8sNamespaceInfo{
		Id:             string(namespace.UID),
		Name:           namespace.Name,
		Status:         namespace.Status,
		CreationDate:   namespace.CreationTimestamp.Format(time.RFC3339),
		NamespaceOwner: namespace.Labels[namespaceOwnerLabel],
		IsSystem:       isSystemNamespace(*namespace),
		IsDefault:      namespace.Name == defaultNamespace,
	}
}

// CreateNamespace creates a new ingress in a given namespace in a k8s endpoint.
func (kcl *KubeClient) CreateNamespace(info models.K8sNamespaceDetails) error {
	portainerLabels := map[string]string{
		namespaceNameLabel:  stackutils.SanitizeLabel(info.Name),
		namespaceOwnerLabel: stackutils.SanitizeLabel(info.Owner),
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
