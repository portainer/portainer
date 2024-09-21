package cli

import (
	"context"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// IsRBACEnabled checks if RBAC is enabled in the current Kubernetes cluster by listing cluster roles.
// if the cluster roles can be listed, RBAC is enabled.
// otherwise, RBAC is not enabled.
func (kcl *KubeClient) IsRBACEnabled() (bool, error) {
	_, err := kcl.cli.RbacV1().ClusterRoles().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return false, nil
	}
	return true, nil
}
