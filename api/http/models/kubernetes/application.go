package kubernetes

type (
	K8sApplication struct {
		UID          string                 `json:"Uid,omitempty"`
		Name         string                 `json:"Name"`
		Namespace    string                 `json:"Namespace,omitempty"`
		ResourcePool string                 `json:"ResourcePool,omitempty"` // todo: remove this field as part of the Angular to React migration
		Image        string                 `json:"Image,omitempty"`
		StackID      string                 `json:"StackId,omitempty"`
		StackName    string                 `json:"StackName,omitempty"`
		Kind         string                 `json:"Kind,omitempty"`
		Labels       map[string]string      `json:"Labels,omitempty"`
		Resource     K8sApplicationResource `json:"Resource,omitempty"`
	}

	K8sApplicationResource struct {
		CPURequest    int64 `json:"CpuRequest"`
		CPULimit      int64 `json:"CpuLimit"`
		MemoryRequest int64 `json:"MemoryRequest"`
		MemoryLimit   int64 `json:"MemoryLimit"`
	}
)
