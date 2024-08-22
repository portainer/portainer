package cli

import (
	"context"
	"fmt"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetClusterRoleBindings gets all the clusterRoleBindings for at the cluster level in a k8s endpoint.
// It returns a list of K8sClusterRoleBinding objects.
func (kcl *KubeClient) GetClusterRoleBindings() ([]models.K8sClusterRoleBinding, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchClusterRoleBindings()
	}

	return []models.K8sClusterRoleBinding{}, fmt.Errorf("non-admin users are not allowed to access cluster role bindings")
}

// fetchClusterRoleBindings returns a list of all cluster roles in the cluster.
func (kcl *KubeClient) fetchClusterRoleBindings() ([]models.K8sClusterRoleBinding, error) {
	clusterRoleBindings, err := kcl.cli.RbacV1().ClusterRoleBindings().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sClusterRoleBinding, 0)
	for _, clusterRoleBinding := range clusterRoleBindings.Items {
		results = append(results, parseClusterRoleBinding(clusterRoleBinding))
	}

	return results, nil
}

// parseClusterRoleBinding converts a rbacv1.ClusterRoleBinding object to a models.K8sClusterRoleBinding object.
func parseClusterRoleBinding(clusterRoleBinding rbacv1.ClusterRoleBinding) models.K8sClusterRoleBinding {
	return models.K8sClusterRoleBinding{
		Name:         clusterRoleBinding.Name,
		RoleRef:      clusterRoleBinding.RoleRef,
		Subjects:     clusterRoleBinding.Subjects,
		CreationDate: clusterRoleBinding.CreationTimestamp.Time,
	}
}
