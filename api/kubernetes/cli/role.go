package cli

import (
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func getPortainerUserDefaultPolicies() []rbacv1.PolicyRule {
	// TODO: this policy should not allow to list resourcequotas in the cluster
	// To be removed once the front-end has been refactored to list resourcesquotas inside namespaces
	return []rbacv1.PolicyRule{
		{
			Verbs:     []string{"list"},
			Resources: []string{"namespaces", "resourcequotas", "nodes"},
			APIGroups: []string{""},
		},
	}
}

func (kcl *KubeClient) createPortainerUserClusterRole() error {
	clusterRole := &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: portainerUserCRName,
		},
		Rules: getPortainerUserDefaultPolicies(),
	}

	_, err := kcl.cli.RbacV1().ClusterRoles().Create(clusterRole)
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return err
	}

	return nil
}
