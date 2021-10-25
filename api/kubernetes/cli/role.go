package cli

import (
	"context"

	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func getPortainerUserDefaultPolicies() []rbacv1.PolicyRule {
	return []rbacv1.PolicyRule{
		{
			Verbs:     []string{"list", "get"},
			Resources: []string{"namespaces", "nodes"},
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
