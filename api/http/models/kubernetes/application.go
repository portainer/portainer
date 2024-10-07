package kubernetes

import (
	"time"

	corev1 "k8s.io/api/core/v1"
)

type K8sApplication struct {
	ID                    string                 `json:"Id"`
	Name                  string                 `json:"Name"`
	Image                 string                 `json:"Image"`
	Containers            []interface{}          `json:"Containers,omitempty"`
	Services              []corev1.Service       `json:"Services"`
	CreationDate          time.Time              `json:"CreationDate"`
	ApplicationOwner      string                 `json:"ApplicationOwner,omitempty"`
	StackName             string                 `json:"StackName,omitempty"`
	ResourcePool          string                 `json:"ResourcePool"`
	ApplicationType       string                 `json:"ApplicationType"`
	Metadata              *Metadata              `json:"Metadata,omitempty"`
	Status                string                 `json:"Status"`
	TotalPodsCount        int                    `json:"TotalPodsCount"`
	RunningPodsCount      int                    `json:"RunningPodsCount"`
	DeploymentType        string                 `json:"DeploymentType"`
	Pods                  []Pod                  `json:"Pods,omitempty"`
	Configurations        []Configuration        `json:"Configurations,omitempty"`
	LoadBalancerIPAddress string                 `json:"LoadBalancerIPAddress,omitempty"`
	PublishedPorts        []PublishedPort        `json:"PublishedPorts,omitempty"`
	Namespace             string                 `json:"Namespace,omitempty"`
	UID                   string                 `json:"Uid,omitempty"`
	StackID               string                 `json:"StackId,omitempty"`
	ServiceID             string                 `json:"ServiceId,omitempty"`
	ServiceName           string                 `json:"ServiceName,omitempty"`
	ServiceType           string                 `json:"ServiceType,omitempty"`
	Kind                  string                 `json:"Kind,omitempty"`
	MatchLabels           map[string]string      `json:"MatchLabels,omitempty"`
	Labels                map[string]string      `json:"Labels,omitempty"`
	Resource              K8sApplicationResource `json:"Resource,omitempty"`
}

type Metadata struct {
	Labels map[string]string `json:"labels"`
}

type Pod struct {
	Status string `json:"Status"`
}

type Configuration struct {
	Data               map[string]interface{} `json:"Data,omitempty"`
	Kind               string                 `json:"Kind"`
	ConfigurationOwner string                 `json:"ConfigurationOwner"`
}

type PublishedPort struct {
	IngressRules []IngressRule `json:"IngressRules"`
	Port         int           `json:"Port"`
}

type IngressRule struct {
	Host string    `json:"Host"`
	IP   string    `json:"IP"`
	Path string    `json:"Path"`
	TLS  []TLSInfo `json:"TLS"`
}

type TLSInfo struct {
	Hosts []string `json:"hosts"`
}

// Existing types
type K8sApplicationResource struct {
	CPURequest    float64 `json:"CpuRequest"`
	CPULimit      float64 `json:"CpuLimit"`
	MemoryRequest int64   `json:"MemoryRequest"`
	MemoryLimit   int64   `json:"MemoryLimit"`
}
