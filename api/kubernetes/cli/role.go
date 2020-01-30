package cli

import (
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func getPortainerUserDefaultPolicies() []rbacv1.PolicyRule {
	return []rbacv1.PolicyRule{
		{
			Verbs:     []string{"list"},
			Resources: []string{"namespaces", "resourcequotas", "nodes", "services"},
			APIGroups: []string{""},
		},
		{
			Verbs:     []string{"list"},
			Resources: []string{"deployments", "daemonsets"},
			APIGroups: []string{"apps"},
		},
	}
}

func (kcl *KubeClient) createPortainerUserClusterRole() error {
	_, err := kcl.cli.RbacV1().ClusterRoles().Get(portainerUserCRName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		clusterRole := &rbacv1.ClusterRole{
			ObjectMeta: metav1.ObjectMeta{
				Name: portainerUserCRName,
			},
			Rules: getPortainerUserDefaultPolicies(),
		}

		_, err := kcl.cli.RbacV1().ClusterRoles().Create(clusterRole)
		if err != nil {
			return err
		}

		return nil
	}

	return err
}
