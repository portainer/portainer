package kubernetes

import "time"

type (
	K8sClusterRoleBinding struct {
		Name         string                         `json:"name"`
		RoleName     string                         `json:"roleName"`
		RoleKind     string                         `json:"roleKind"`
		Subjects     []K8sClusterRoleBindingSubject `json:"subjects"`
		CreationDate time.Time                      `json:"creationDate"`
	}

	K8sClusterRoleBindingSubject struct {
		Kind      string `json:"kind"`
		Name      string `json:"name"`
		Namespace string `json:"namespace"`
	}
)
