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
		UID                 string                   `json:"UID"`
		Name                string                   `json:"Name"`
		Namespace           string                   `json:"Namespace"`
		CreationDate        string                   `json:"CreationDate"`
		Annotations         map[string]string        `json:"Annotations"`
		Data                map[string]string        `json:"Data"`
		IsUsed              bool                     `json:"IsUsed"`
		ConfigurationOwners []K8sConfigurationOwners `json:"ConfigurationOwners"`
	}

	K8sConfigurationOwners struct {
		ConfigurationOwner   string `json:"ConfigurationOwner"`
		K8sConfigurationKind string `json:"K8sConfigurationKind"`
		ConfigurationOwnerId string `json:"ConfigurationOwnerId"`
	}
)
