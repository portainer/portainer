package cli

import (
	"context"
	"fmt"

	portaineree "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetResourceQuotas gets all resource quotas in the current k8s environment(endpoint).
// The kube client must have cluster scope read access to do this.
func (kcl *KubeClient) GetResourceQuotas(namespace string) (*[]corev1.ResourceQuota, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchResourceQuotasForAdmin(namespace)
	}
	return kcl.fetchResourceQuotasForNonAdmin(namespace)
}

// fetchResourceQuotasForAdmin gets the resource quotas in the current k8s environment(endpoint) for an admin user.
// The kube client must have cluster scope read access to do this.
func (kcl *KubeClient) fetchResourceQuotasForAdmin(namespace string) (*[]corev1.ResourceQuota, error) {
	return kcl.fetchResourceQuotas(namespace)
}

// fetchResourceQuotasForNonAdmin gets the resource quotas in the current k8s environment(endpoint) for a non-admin user.
// the role of the user must have read access to the resource quotas in the defined namespaces.
func (kcl *KubeClient) fetchResourceQuotasForNonAdmin(namespace string) (*[]corev1.ResourceQuota, error) {
	log.Debug().Msgf("Fetching resource quotas for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
		return nil, nil
	}

	resourceQuotas, err := kcl.fetchResourceQuotas(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.BuildNonAdminNamespacesMap()
	results := []corev1.ResourceQuota{}
	for _, resourceQuota := range *resourceQuotas {
		if _, exists := nonAdminNamespaceSet[resourceQuota.Namespace]; exists {
			results = append(results, resourceQuota)
		}
	}

	return &results, nil
}

func (kcl *KubeClient) fetchResourceQuotas(namespace string) (*[]corev1.ResourceQuota, error) {
	resourceQuotas, err := kcl.cli.CoreV1().ResourceQuotas(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("an error occured, failed to list resource quotas for the admin user: %w", err)
	}

	return &resourceQuotas.Items, nil
}

// GetPortainerResourceQuota gets the resource quota for the portainer namespace.
// The resource quota is prefixed with "portainer-rq-".
func (kcl *KubeClient) GetPortainerResourceQuota(namespace string) (*corev1.ResourceQuota, error) {
	return kcl.cli.CoreV1().ResourceQuotas(namespace).Get(context.TODO(), "portainer-rq-"+namespace, metav1.GetOptions{})
}

// GetResourceQuota gets a resource quota in a specific namespace.
func (kcl *KubeClient) GetResourceQuota(namespace, resourceQuota string) (*corev1.ResourceQuota, error) {
	return kcl.cli.CoreV1().ResourceQuotas(namespace).Get(context.TODO(), resourceQuota, metav1.GetOptions{})
}

// UpdateNamespacesWithResourceQuotas updates the namespaces with the resource quotas.
// The resource quotas are matched with the namespaces by name.
func (kcl *KubeClient) UpdateNamespacesWithResourceQuotas(namespaces map[string]portaineree.K8sNamespaceInfo, resourceQuotas []corev1.ResourceQuota) map[string]portaineree.K8sNamespaceInfo {
	namespacesWithQuota := map[string]portaineree.K8sNamespaceInfo{}

	for _, namespace := range namespaces {
		namespace.ResourceQuota = kcl.GetResourceQuotaFromNamespace(namespace, resourceQuotas)
		namespacesWithQuota[namespace.Name] = namespace
	}

	return namespacesWithQuota
}

// GetResourceQuotaFromNamespace updates the namespace.ResourceQuota field with the resource quota information.
// The resource quota is matched with the namespace and prefixed with "portainer-rq-".
func (kcl *KubeClient) GetResourceQuotaFromNamespace(namespace portaineree.K8sNamespaceInfo, resourceQuotas []corev1.ResourceQuota) *corev1.ResourceQuota {
	for _, resourceQuota := range resourceQuotas {
		if resourceQuota.ObjectMeta.Namespace == namespace.Name && resourceQuota.ObjectMeta.Name == "portainer-rq-"+namespace.Name {
			return &resourceQuota
		}
	}

	return nil
}