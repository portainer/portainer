package kubernetes

type (
	K8sDashboard struct {
		NamespacesCount   int64 `json:"namespacesCount"`
		ApplicationsCount int64 `json:"applicationsCount"`
		ServicesCount     int64 `json:"servicesCount"`
		IngressesCount    int64 `json:"ingressesCount"`
		ConfigMapsCount   int64 `json:"configMapsCount"`
		SecretsCount      int64 `json:"secretsCount"`
		VolumesCount      int64 `json:"volumesCount"`
	}
)
