package kubernetes

type (
	K8sApplication struct {
		UID       string            `json:",omitempty"`
		Name      string            `json:""`
		Namespace string            `json:",omitempty"`
		Kind      string            `json:",omitempty"`
		Labels    map[string]string `json:",omitempty"`
	}
)
