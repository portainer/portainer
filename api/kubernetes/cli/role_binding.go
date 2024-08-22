package cli

import (
	"context"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetRoleBindings gets all the roleBindings for either at the cluster level or a given namespace in a k8s endpoint.
// It returns a list of K8sRoleBinding objects.
func (kcl *KubeClient) GetRoleBindings(namespace string) ([]models.K8sRoleBinding, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchRoleBindings(namespace)
	}

	return kcl.fetchRolebindingsForNonAdmin(namespace)
}

// fetchRolebindingsForNonAdmin gets all the roleBindings for either at the cluster level or a given namespace in a k8s endpoint.
// the namespace will be coming from NonAdminNamespaces as non-admin users are restricted to certain namespaces.
// it returns a list of K8sRoleBinding objects.
func (kcl *KubeClient) fetchRolebindingsForNonAdmin(namespace string) ([]models.K8sRoleBinding, error) {
	roleBindings, err := kcl.fetchRoleBindings(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sRoleBinding, 0)
	for _, roleBinding := range roleBindings {
		if _, ok := nonAdminNamespaceSet[roleBinding.Namespace]; ok {
			results = append(results, roleBinding)
		}
	}

	return results, nil
}

// fetchRoleBindings returns a list of all Roles in the specified namespace.
func (kcl *KubeClient) fetchRoleBindings(namespace string) ([]models.K8sRoleBinding, error) {
	roleBindings, err := kcl.cli.RbacV1().RoleBindings(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sRoleBinding, 0)
	for _, roleBinding := range roleBindings.Items {
		results = append(results, parseRoleBinding(roleBinding))
	}

	return results, nil
}

// parseRoleBinding converts a rbacv1.RoleBinding object to a models.K8sRoleBinding object.
func parseRoleBinding(roleBinding rbacv1.RoleBinding) models.K8sRoleBinding {
	return models.K8sRoleBinding{
		Name:         roleBinding.Name,
		Namespace:    roleBinding.Namespace,
		RoleRef:      roleBinding.RoleRef,
		Subjects:     roleBinding.Subjects,
		CreationDate: roleBinding.CreationTimestamp.Time,
	}
}
