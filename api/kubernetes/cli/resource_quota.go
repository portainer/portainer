package cli

import (
	"context"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetResourceQuotas gets all resource quotas in the current k8s environment(endpoint).
// if the user is an admin, all resource quotas in all namespaces are fetched.
// otherwise, namespaces the non-admin user has access to will be used to filter the resource quotas.
func (kcl *KubeClient) GetResourceQuotas(namespace string) (*[]corev1.ResourceQuota, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchResourceQuotas(namespace)
	}
	return kcl.fetchResourceQuotasForNonAdmin(namespace)
}

// fetchResourceQuotasForNonAdmin gets the resource quotas in the current k8s environment(endpoint) for a non-admin user.
// the role of the user must have read access to the resource quotas in the defined namespaces.
func (kcl *KubeClient) fetchResourceQuotasForNonAdmin(namespace string) (*[]corev1.ResourceQuota, error) {
	log.Debug().Msgf("Fetching resource quotas for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
		return nil, nil
	}

	resourceQuotas, err := kcl.fetchResourceQuotas(namespace)
	if err != nil && !k8serrors.IsNotFound(err) {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
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
		return nil, fmt.Errorf("an error occurred, failed to list resource quotas for the admin user: %w", err)
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
func (kcl *KubeClient) UpdateNamespacesWithResourceQuotas(namespaces map[string]portainer.K8sNamespaceInfo, resourceQuotas []corev1.ResourceQuota) []portainer.K8sNamespaceInfo {
	namespacesWithQuota := map[string]portainer.K8sNamespaceInfo{}

	for _, namespace := range namespaces {
		resourceQuota := kcl.GetResourceQuotaFromNamespace(namespace, resourceQuotas)
		if resourceQuota != nil {
			namespace.ResourceQuota = resourceQuota
		}

		namespacesWithQuota[namespace.Name] = namespace
	}

	return kcl.ConvertNamespaceMapToSlice(namespacesWithQuota)
}

// GetResourceQuotaFromNamespace gets the resource quota in a specific namespace where the resource quota's name is prefixed with "portainer-rq-".
func (kcl *KubeClient) GetResourceQuotaFromNamespace(namespace portainer.K8sNamespaceInfo, resourceQuotas []corev1.ResourceQuota) *corev1.ResourceQuota {
	for _, resourceQuota := range resourceQuotas {
		if resourceQuota.ObjectMeta.Namespace == namespace.Name && resourceQuota.ObjectMeta.Name == "portainer-rq-"+namespace.Name {
			return &resourceQuota
		}
	}

	return nil
}
