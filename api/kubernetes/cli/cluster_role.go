package cli

import (
	"context"
	"fmt"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetClusterRoles gets all the clusterRoles for at the cluster level in a k8s endpoint.
// It returns a list of K8sClusterRole objects.
func (kcl *KubeClient) GetClusterRoles() ([]models.K8sClusterRole, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchClusterRoles()
	}

	return []models.K8sClusterRole{}, fmt.Errorf("non-admin users are not allowed to access cluster roles")
}

// fetchClusterRoles returns a list of all Roles in the specified namespace.
func (kcl *KubeClient) fetchClusterRoles() ([]models.K8sClusterRole, error) {
	clusterRoles, err := kcl.cli.RbacV1().ClusterRoles().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sClusterRole, 0)
	for _, clusterRole := range clusterRoles.Items {
		results = append(results, parseClusterRole(clusterRole))
	}

	return results, nil
}

// parseClusterRole converts a rbacv1.ClusterRole object to a models.K8sClusterRole object.
func parseClusterRole(clusterRole rbacv1.ClusterRole) models.K8sClusterRole {
	return models.K8sClusterRole{
		Name:         clusterRole.Name,
		CreationDate: clusterRole.CreationTimestamp.Time,
	}
}
