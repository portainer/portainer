package kubernetes

type K8sEndpoint struct {
	UID       string               `json:"uid,omitempty"`
	Name      string               `json:"name,omitempty"`
	Namespace string               `json:"namespace,omitempty"`
	Addresses []K8sEndpointAddress `json:"addresses,omitempty"`
	Ports     []K8sEndpointPort    `json:"ports,omitempty"`
}

type K8sEndpointAddress struct {
	IP       string `json:"ip,omitempty"`
	NodeName string `json:"nodeName,omitempty"`
}

type K8sEndpointPort struct {
	Name     string `json:"name,omitempty"`
	Port     int32  `json:"port,omitempty"`
	Protocol string `json:"protocol,omitempty"`
}
