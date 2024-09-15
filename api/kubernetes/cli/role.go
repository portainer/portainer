package cli

import (
	"context"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetRoles gets all the roles for either at the cluster level or a given namespace in a k8s endpoint.
// It returns a list of K8sRole objects.
func (kcl *KubeClient) GetRoles(namespace string) ([]models.K8sRole, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchRoles(namespace)
	}

	return kcl.fetchRolesForNonAdmin(namespace)
}

// fetchRolesForNonAdmin gets all the roles for either at the cluster level or a given namespace in a k8s endpoint.
// the namespace will be coming from NonAdminNamespaces as non-admin users are restricted to certain namespaces.
// it returns a list of K8sRole objects.
func (kcl *KubeClient) fetchRolesForNonAdmin(namespace string) ([]models.K8sRole, error) {
	roles, err := kcl.fetchRoles(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sRole, 0)
	for _, role := range roles {
		if _, ok := nonAdminNamespaceSet[role.Namespace]; ok {
			results = append(results, role)
		}
	}

	return results, nil
}

// fetchRoles returns a list of all Roles in the specified namespace.
func (kcl *KubeClient) fetchRoles(namespace string) ([]models.K8sRole, error) {
	roles, err := kcl.cli.RbacV1().Roles(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sRole, 0)
	for _, role := range roles.Items {
		results = append(results, parseRole(role))
	}

	return results, nil
}

// parseRole converts a rbacv1.Role object to a models.K8sRole object.
func parseRole(role rbacv1.Role) models.K8sRole {
	return models.K8sRole{
		Name:         role.Name,
		Namespace:    role.Namespace,
		CreationDate: role.CreationTimestamp.Time,
	}
}

func getPortainerUserDefaultPolicies() []rbacv1.PolicyRule {
	return []rbacv1.PolicyRule{
		{
			Verbs:     []string{"list", "get"},
			Resources: []string{"namespaces", "nodes", "endpoints"},
			APIGroups: []string{""},
		},
		{
			Verbs:     []string{"list"},
			Resources: []string{"storageclasses"},
			APIGroups: []string{"storage.k8s.io"},
		},
		{
			Verbs:     []string{"list", "get"},
			Resources: []string{"namespaces", "pods", "nodes"},
			APIGroups: []string{"metrics.k8s.io"},
		},
		{
			Verbs:     []string{"list"},
			Resources: []string{"ingressclasses"},
			APIGroups: []string{"networking.k8s.io"},
		},
	}
}

func (kcl *KubeClient) upsertPortainerK8sClusterRoles() error {
	clusterRole := &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: portainerUserCRName,
		},
		Rules: getPortainerUserDefaultPolicies(),
	}

	_, err := kcl.cli.RbacV1().ClusterRoles().Create(context.TODO(), clusterRole, metav1.CreateOptions{})
	if err != nil {
		if k8serrors.IsAlreadyExists(err) {
			_, err = kcl.cli.RbacV1().ClusterRoles().Update(context.TODO(), clusterRole, metav1.UpdateOptions{})
		}
		if err != nil {
			return err
		}
	}

	return nil
}
