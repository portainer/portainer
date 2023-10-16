package kubernetes

import (
	"fmt"
	"net/http"

	"k8s.io/apimachinery/pkg/api/resource"
)

type K8sNamespaceDetails struct {
	Name          string            `json:"Name"`
	Annotations   map[string]string `json:"Annotations"`
	ResourceQuota *K8sResourceQuota `json:"ResourceQuota"`
	Owner         string            `json:"Owner"`
}

type K8sResourceQuota struct {
	Enabled bool   `json:"enabled"`
	Memory  string `json:"memory"`
	CPU     string `json:"cpu"`
}

func (r *K8sNamespaceDetails) Validate(request *http.Request) error {
	if r.ResourceQuota != nil && r.ResourceQuota.Enabled {
		_, err := resource.ParseQuantity(r.ResourceQuota.Memory)
		if err != nil {
			return fmt.Errorf("error parsing memory quota value: %w", err)
		}

		_, err = resource.ParseQuantity(r.ResourceQuota.CPU)
		if err != nil {
			return fmt.Errorf("error parsing cpu quota value: %w", err)
		}
	}

	return nil
}
