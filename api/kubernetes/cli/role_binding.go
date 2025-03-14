package cli

import (
	"context"
	"strings"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/internal/errorlist"
	"github.com/rs/zerolog/log"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
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
		results = append(results, kcl.parseRoleBinding(roleBinding))
	}

	return results, nil
}

// parseRoleBinding converts a rbacv1.RoleBinding object to a models.K8sRoleBinding object.
func (kcl *KubeClient) parseRoleBinding(roleBinding rbacv1.RoleBinding) models.K8sRoleBinding {
	return models.K8sRoleBinding{
		Name:         roleBinding.Name,
		UID:          roleBinding.UID,
		Namespace:    roleBinding.Namespace,
		RoleRef:      roleBinding.RoleRef,
		Subjects:     roleBinding.Subjects,
		CreationDate: roleBinding.CreationTimestamp.Time,
		IsSystem:     kcl.isSystemRoleBinding(&roleBinding),
	}
}

func (kcl *KubeClient) isSystemRoleBinding(rb *rbacv1.RoleBinding) bool {
	if strings.HasPrefix(rb.Name, "system:") {
		return true
	}

	if rb.Labels != nil {
		if rb.Labels["kubernetes.io/bootstrapping"] == "rbac-defaults" {
			return true
		}
	}

	if rb.RoleRef.Name != "" {
		role, err := kcl.getRole(rb.Namespace, rb.RoleRef.Name)
		if err != nil {
			return false
		}

		// Linked to a role that is marked a system role
		if kcl.isSystemRole(role) {
			return true
		}
	}

	return false
}

func (kcl *KubeClient) getRole(namespace, name string) (*rbacv1.Role, error) {
	client := kcl.cli.RbacV1().Roles(namespace)
	return client.Get(context.Background(), name, metav1.GetOptions{})
}

// DeleteRoleBindings processes a K8sServiceDeleteRequest by deleting each service
// in its given namespace.
func (kcl *KubeClient) DeleteRoleBindings(reqs models.K8sRoleBindingDeleteRequests) error {
	var errors []error
	for namespace := range reqs {
		for _, name := range reqs[namespace] {
			client := kcl.cli.RbacV1().RoleBindings(namespace)

			roleBinding, err := client.Get(context.Background(), name, metav1.GetOptions{})
			if err != nil {
				if k8serrors.IsNotFound(err) {
					continue
				}

				// This is a more serious error to do with the client so we return right away
				return err
			}

			if kcl.isSystemRoleBinding(roleBinding) {
				log.Error().Str("role_name", name).Msg("ignoring delete of 'system' role binding, not allowed")
			}

			if err := client.Delete(context.Background(), name, metav1.DeleteOptions{}); err != nil {
				errors = append(errors, err)
			}
		}
	}
	return errorlist.Combine(errors)
}
