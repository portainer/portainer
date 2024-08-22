package kubernetes

import "time"

type (
	K8sRoleBinding struct {
		Name         string                  `json:"name"`
		Namespace    string                  `json:"namespace"`
		RoleName     string                  `json:"roleName"`
		RoleKind     string                  `json:"roleKind"`
		Subjects     []K8sRoleBindingSubject `json:"subjects"`
		CreationDate time.Time               `json:"CreationDate"`
	}

	K8sRoleBindingSubject struct {
		Kind      string `json:"kind"`
		Name      string `json:"name"`
		Namespace string `json:"namespace"`
	}
)
