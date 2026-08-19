package kubernetes

type K8sMetrics struct {
	Resources []K8sMetricsResources `json:"resources"`
}

type K8sMetricsResources struct {
	Kind         string   `json:"Kind,omitempty"`
	Name         string   `json:"Name,omitempty"`
	Namespaced   bool     `json:"Namespaced,omitempty"`
	SingularName string   `json:"SingularName,omitempty"`
	Verbs        []string `json:"Verbs,omitempty"`
}
