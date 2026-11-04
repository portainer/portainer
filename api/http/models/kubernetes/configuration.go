package kubernetes

import (
	"fmt"
	"net/http"
)

type (
	K8sConfigMap struct {
		K8sConfiguration
	}

	// K8sSecret carries base64 encoded Data values, unlike K8sConfigMap whose values
	// are plain text: a secret holds arbitrary bytes that a JSON string cannot represent.
	K8sSecret struct {
		K8sConfiguration
		SecretType string `json:"SecretType"`
	}

	K8sConfiguration struct {
		UID                         string                          `json:"UID"`
		Name                        string                          `json:"Name"`
		Namespace                   string                          `json:"Namespace"`
		CreationDate                string                          `json:"CreationDate"`
		Annotations                 map[string]string               `json:"Annotations"`
		Data                        map[string]string               `json:"Data"`
		IsUsed                      bool                            `json:"IsUsed"`
		Labels                      map[string]string               `json:"Labels"`
		ConfigurationOwnerResources []K8sConfigurationOwnerResource `json:"ConfigurationOwners"`
		ConfigurationOwner          string                          `json:"ConfigurationOwner"`
		ConfigurationOwnerId        string                          `json:"ConfigurationOwnerId"`
	}

	K8sConfigurationOwnerResource struct {
		Id           string `json:"Id"`
		Name         string `json:"Name"`
		ResourceKind string `json:"ResourceKind"`
	}

	// K8sConfigurationWriteRequest holds the fields shared by the ConfigMap and Secret
	// write payloads. The namespace is taken from the request route rather than the
	// payload, and Data holds plain values: Secret data is encoded server-side, so
	// callers never base64 anything themselves.
	//
	// On update, a nil map leaves the live value untouched while a non-nil map replaces
	// it wholesale, so an empty map clears it. Fields these payloads do not model
	// (a Secret's immutable type, a ConfigMap's binary data, owner references) are
	// always preserved from the live object.
	K8sConfigurationWriteRequest struct {
		Name        string            `json:"Name"`
		Data        map[string]string `json:"Data"`
		Labels      map[string]string `json:"Labels,omitempty"`
		Annotations map[string]string `json:"Annotations,omitempty"`
	}

	// K8sConfigMapWriteRequest is the payload for creating or updating a ConfigMap.
	K8sConfigMapWriteRequest struct {
		K8sConfigurationWriteRequest
	}

	// K8sSecretWriteRequest is the payload for creating or updating a Secret.
	// SecretType defaults to Opaque on create and is immutable afterwards, so it is
	// ignored on update.
	K8sSecretWriteRequest struct {
		K8sConfigurationWriteRequest
		SecretType string `json:"SecretType,omitempty"`
	}
)

func (r *K8sConfigMapWriteRequest) Validate(*http.Request) error {
	return r.validate("config map")
}

func (r *K8sSecretWriteRequest) Validate(*http.Request) error {
	return r.validate("secret")
}

// validate checks the fields shared by the configuration write payloads. Names and
// data keys are validated in full by the Kubernetes API, which reports a far more
// precise error than a second implementation here would.
func (r *K8sConfigurationWriteRequest) validate(kind string) error {
	if r.Name == "" {
		return fmt.Errorf("missing %s name from the request payload", kind)
	}

	return nil
}
