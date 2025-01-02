package kubernetes

import (
	"errors"
	"net/http"
	"time"

	"k8s.io/apimachinery/pkg/types"
)

type (
	K8sClusterRole struct {
		Name         string    `json:"name"`
		UID          types.UID `json:"uid"`
		CreationDate time.Time `json:"creationDate"`
		IsSystem     bool      `json:"isSystem"`
	}

	K8sClusterRoleDeleteRequests []string
)

func (r K8sClusterRoleDeleteRequests) Validate(request *http.Request) error {
	if len(r) == 0 {
		return errors.New("missing deletion request list in payload")
	}

	return nil
}
