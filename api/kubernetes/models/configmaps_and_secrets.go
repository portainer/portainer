package models

type (
	K8sConfigMapOrSecret struct {
		UID          string            `json:"UID"`
		Name         string            `json:"Name"`
		Namespace    string            `json:"Namespace"`
		CreationDate string            `json:"CreationDate"`
		Annotations  map[string]string `json:"Annotations"`
		Data         map[string]string `json:"Data"`
		Applications []string          `json:"Applications"`
		IsSecret     bool              `json:"IsSecret"`

		// SecretType will be an empty string for config maps.
		SecretType string `json:"SecretType"`
	}
)
