package kubernetes

type (
	K8sDashboard struct {
		NamespacesCount   int `json:"namespacesCount"`
		ApplicationsCount int `json:"applicationsCount"`
		ServicesCount     int `json:"servicesCount"`
		IngressesCount    int `json:"ingressesCount"`
		ConfigMapsCount   int `json:"configMapsCount"`
		SecretsCount      int `json:"secretsCount"`
		VolumesCount      int `json:"volumesCount"`
	}
)
