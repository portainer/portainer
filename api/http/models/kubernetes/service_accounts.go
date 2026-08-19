package kubernetes

import (
	"errors"
	"net/http"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
)

type (
	K8sServiceAccount struct {
		Name                         string                        `json:"name"`
		UID                          types.UID                     `json:"uid"`
		Namespace                    string                        `json:"namespace"`
		CreationDate                 time.Time                     `json:"creationDate"`
		IsSystem                     bool                          `json:"isSystem"`
		ImagePullSecrets             []corev1.LocalObjectReference `json:"imagePullSecrets,omitempty"`
		AutomountServiceAccountToken *bool                         `json:"automountServiceAccountToken,omitempty"`
		Labels                       map[string]string             `json:"labels,omitempty"`
		Annotations                  map[string]string             `json:"annotations,omitempty"`
	}

	// K8sServiceAcountDeleteRequests is a mapping of namespace names to a slice of service account names.
	K8sServiceAccountDeleteRequests map[string][]string
)

type K8sServiceAccountImagePullSecretsUpdatePayload struct {
	SecretNames []string `json:"secretNames"`
}

func (r *K8sServiceAccountImagePullSecretsUpdatePayload) Validate(_ *http.Request) error {
	return nil
}

func (r K8sServiceAccountDeleteRequests) Validate(request *http.Request) error {
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
