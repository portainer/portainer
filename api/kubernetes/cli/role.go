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
			Resources: []string{"namespaces", "nodes"},
			APIGroups: []string{""},
		},
		{
			Verbs:     []string{"list"},
			Resources: []string{"storageclasses"},
			APIGroups: []string{"storage.k8s.io"},
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

	_, err := kcl.cli.RbacV1().ClusterRoles().Create(clusterRole)
	if err != nil  {
		if k8serrors.IsAlreadyExists(err) {
			_, err = kcl.cli.RbacV1().ClusterRoles().Update(clusterRole)
		}
		if err != nil {
			return err
		}
	}

	return nil
}
