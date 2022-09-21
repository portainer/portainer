package models

import "net/http"

type K8sNamespaceInfo struct {
	Name        string            `json:"Name"`
	Annotations map[string]string `json:"Annotations"`
}

func (r *K8sNamespaceInfo) Validate(request *http.Request) error {
	return nil
}
