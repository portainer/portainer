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
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetClusterRoles gets all the clusterRoles for at the cluster level in a k8s endpoint.
// It returns a list of K8sClusterRole objects.
func (kcl *KubeClient) GetClusterRoles() ([]models.K8sClusterRole, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchClusterRoles()
	}

	return []models.K8sClusterRole{}, errors.New("non-admin users are not allowed to access cluster roles")
}

// fetchClusterRoles returns a list of all Roles in the specified namespace.
func (kcl *KubeClient) fetchClusterRoles() ([]models.K8sClusterRole, error) {
	clusterRoles, err := kcl.cli.RbacV1().ClusterRoles().List(context.TODO(), meta.ListOptions{})
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
		UID:          clusterRole.UID,
		IsSystem:     isSystemClusterRole(&clusterRole),
	}
}

func (kcl *KubeClient) DeleteClusterRoles(req models.K8sClusterRoleDeleteRequests) error {
	var errors []error
	for _, name := range req {
		client := kcl.cli.RbacV1().ClusterRoles()

		clusterRole, err := client.Get(context.Background(), name, meta.GetOptions{})
		if err != nil {
			if k8serrors.IsNotFound(err) {
				continue
			}
			// this is a more serious error to do with the client so we return right away
			return err
		}

		if isSystemClusterRole(clusterRole) {
			log.Warn().Str("role_name", name).Msg("ignoring delete of 'system' cluster role, not allowed")
		}

		err = client.Delete(context.Background(), name, meta.DeleteOptions{})
		if err != nil {
			log.Err(err).Str("role_name", name).Msg("unable to delete the cluster role")
			errors = append(errors, err)
		}
	}

	return errorlist.Combine(errors)
}

func isSystemClusterRole(role *rbacv1.ClusterRole) bool {
	if role.Namespace == "kube-system" || role.Namespace == "kube-public" ||
		role.Namespace == "kube-node-lease" || role.Namespace == "portainer" {
		return true
	}

	if strings.HasPrefix(role.Name, "system:") {
		return true
	}

	if role.Labels != nil {
		if role.Labels["kubernetes.io/bootstrapping"] == "rbac-defaults" {
			return true
		}
	}

	roles := getPortainerDefaultK8sRoleNames()
	for i := range roles {
		if role.Name == roles[i] {
			return true
		}
	}

	return false
}
