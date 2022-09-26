package models

import "net/http"

type K8sNamespaceDetails struct {
	Name        string            `json:"Name"`
	Annotations map[string]string `json:"Annotations"`
}

func (r *K8sNamespaceDetails) Validate(request *http.Request) error {
	return nil
}
