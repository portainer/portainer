package cli

import (
	"context"
	"errors"
	"strings"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/internal/errorlist"
	"github.com/rs/zerolog/log"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetClusterRoleBindings gets all the clusterRoleBindings for at the cluster level in a k8s endpoint.
// It returns a list of K8sClusterRoleBinding objects.
func (kcl *KubeClient) GetClusterRoleBindings() ([]models.K8sClusterRoleBinding, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchClusterRoleBindings()
	}

	return []models.K8sClusterRoleBinding{}, errors.New("non-admin users are not allowed to access cluster role bindings")
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
		UID:          clusterRoleBinding.UID,
		Namespace:    clusterRoleBinding.Namespace,
		RoleRef:      clusterRoleBinding.RoleRef,
		Subjects:     clusterRoleBinding.Subjects,
		CreationDate: clusterRoleBinding.CreationTimestamp.Time,
		IsSystem:     isSystemClusterRoleBinding(&clusterRoleBinding),
	}
}

// DeleteClusterRoleBindings processes a K8sClusterRoleBindingDeleteRequest
// by deleting each cluster role binding in its given namespace. If deleting a specific cluster role binding
// fails, the error is logged and we continue to delete the remaining cluster role bindings.
func (kcl *KubeClient) DeleteClusterRoleBindings(reqs models.K8sClusterRoleBindingDeleteRequests) error {
	var errors []error

	for _, name := range reqs {
		client := kcl.cli.RbacV1().ClusterRoleBindings()

		clusterRoleBinding, err := client.Get(context.Background(), name, metav1.GetOptions{})
		if err != nil {
			if k8serrors.IsNotFound(err) {
				continue
			}

			// This is a more serious error to do with the client so we return right away
			return err
		}

		if isSystemClusterRoleBinding(clusterRoleBinding) {
			log.Warn().Str("role_name", name).Msg("ignoring delete of 'system' cluster role binding, not allowed")
		}

		if err := client.Delete(context.Background(), name, metav1.DeleteOptions{}); err != nil {
			log.Err(err).Str("role_name", name).Msg("unable to delete the cluster role binding")
			errors = append(errors, err)
		}
	}

	return errorlist.Combine(errors)
}

func isSystemClusterRoleBinding(binding *rbacv1.ClusterRoleBinding) bool {
	if strings.HasPrefix(binding.Name, "system:") {
		return true
	}

	if binding.Labels != nil {
		if binding.Labels["kubernetes.io/bootstrapping"] == "rbac-defaults" {
			return true
		}
	}

	for _, sub := range binding.Subjects {
		if strings.HasPrefix(sub.Name, "system:") {
			return true
		}

		if sub.Namespace == "kube-system" ||
			sub.Namespace == "kube-public" ||
			sub.Namespace == "kube-node-lease" ||
			sub.Namespace == "portainer" {
			return true
		}
	}

	return false
}
