package kubernetes

type (
	K8sConfigMap struct {
		K8sConfiguration
	}

	K8sSecret struct {
		K8sConfiguration
		SecretType string `json:"SecretType"`
	}

	K8sConfiguration struct {
		UID                  string            `json:"UID"`
		Name                 string            `json:"Name"`
		Namespace            string            `json:"Namespace"`
		CreationDate         string            `json:"CreationDate"`
		Annotations          map[string]string `json:"Annotations"`
		Data                 map[string]string `json:"Data"`
		Applications         []string          `json:"Applications"`
		ConfigurationOwner   string            `json:"ConfigurationOwner"`
		ConfigurationOwnerId string            `json:"ConfigurationOwnerId"`
	}
)
