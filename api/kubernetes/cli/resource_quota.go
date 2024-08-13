package cli

import (
	"context"
	"fmt"

	portaineree "github.com/portainer/portainer/api"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetResourceQuotas gets all resource quotas in the current k8s environment(endpoint).
// The kube client must have cluster scope read access to do this.
func (kcl *KubeClient) GetResourceQuotas(namespace string) (*[]corev1.ResourceQuota, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchResourceQuotasForAdmin()
	}
	return kcl.fetchResourceQuotasForNonAdmin()
}

// fetchResourceQuotasForAdmin gets the resource quotas in the current k8s environment(endpoint) for an admin user.
// The kube client must have cluster scope read access to do this.
func (kcl *KubeClient) fetchResourceQuotasForAdmin() (*[]corev1.ResourceQuota, error) {
	resourceQuotas, err := kcl.cli.CoreV1().ResourceQuotas("").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("an error occured, failed to list resource quotas for the admin user: %w", err)
	}

	return &resourceQuotas.Items, nil
}

// fetchResourceQuotasForNonAdmin gets the resource quotas in the current k8s environment(endpoint) for a non-admin user.
// the role of the user must have read access to the resource quotas in the defined namespaces.
func (kcl *KubeClient) fetchResourceQuotasForNonAdmin() (*[]corev1.ResourceQuota, error) {
	resourceQuotas := []corev1.ResourceQuota{}
	for _, namespace := range kcl.NonAdminNamespaces {
		resourceQuota, err := kcl.GetResourceQuota(namespace, "portainer-rq-"+namespace)
		if err != nil && !k8serrors.IsNotFound(err) {
			return nil, fmt.Errorf("an error occured, failed to get a resource quota %s of the namespace %s for the non-admin user: %w", resourceQuota.Name, namespace, err)
		}

		if resourceQuota.Namespace != "" && resourceQuota.Name != "" {
			resourceQuotas = append(resourceQuotas, *resourceQuota)
		}
	}

	return &resourceQuotas, nil
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
