package kubernetes

type (
	K8sApplication struct {
		UID       string            `json:",omitempty"`
		Name      string            `json:""`
		Namespace string            `json:",omitempty"`
		Kind      string            `json:",omitempty"`
		Labels    map[string]string `json:",omitempty"`
	}

	K8sApplicationResource struct {
		CPURequest    int64 `json:"cpuRequest"`
		CPULimit      int64 `json:"cpuLimit"`
		MemoryRequest int64 `json:"memoryRequest"`
		MemoryLimit   int64 `json:"memoryLimit"`
	}
)
