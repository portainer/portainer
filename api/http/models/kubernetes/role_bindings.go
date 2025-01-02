package kubernetes

import (
	"errors"
	"net/http"
	"time"

	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/types"
)

type (
	K8sRoleBinding struct {
		Name         string           `json:"name"`
		UID          types.UID        `json:"uid"`
		Namespace    string           `json:"namespace"`
		RoleRef      rbacv1.RoleRef   `json:"roleRef"`
		Subjects     []rbacv1.Subject `json:"subjects"`
		CreationDate time.Time        `json:"creationDate"`
		IsSystem     bool             `json:"isSystem"`
	}

	// K8sRoleBindingDeleteRequests is a mapping of namespace names to a slice of role bindings.
	K8sRoleBindingDeleteRequests map[string][]string
)

func (r K8sRoleBindingDeleteRequests) Validate(request *http.Request) error {
	if len(r) == 0 {
		return errors.New("missing deletion request list in payload")
	}

	for ns := range r {
		if len(ns) == 0 {
			return errors.New("deletion given with empty namespace")
		}
	}
	return nil
}
