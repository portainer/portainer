package kubernetes

import (
	"errors"
	"net/http"
)

type (
	K8sServiceInfo struct {
		Name                          string              `json:",omitempty"`
		UID                           string              `json:",omitempty"`
		Type                          string              `json:",omitempty"`
		Namespace                     string              `json:",omitempty"`
		Annotations                   map[string]string   `json:",omitempty"`
		CreationDate                  string              `json:",omitempty"`
		Labels                        map[string]string   `json:",omitempty"`
		AllocateLoadBalancerNodePorts *bool               `json:",omitempty"`
		Ports                         []K8sServicePort    `json:",omitempty"`
		Selector                      map[string]string   `json:",omitempty"`
		IngressStatus                 []K8sServiceIngress `json:",omitempty"`

		// serviceList screen
		Applications []K8sApplication `json:",omitempty"`
		ClusterIPs   []string         `json:",omitempty"`
		ExternalName string           `json:",omitempty"`
		ExternalIPs  []string         `json:",omitempty"`
	}

	K8sServicePort struct {
		Name       string `json:"Name"`
		NodePort   int    `json:"NodePort"`
		Port       int    `json:"Port"`
		Protocol   string `json:"Protocol"`
		TargetPort string `json:"TargetPort"`
	}

	K8sServiceIngress struct {
		IP       string `json:"IP"`
		Hostname string `json:"Hostname"`
	}

	// K8sServiceDeleteRequests is a mapping of namespace names to a slice of
	// service names.
	K8sServiceDeleteRequests map[string][]string
)

func (s *K8sServiceInfo) Validate(request *http.Request) error {
	if s.Name == "" {
		return errors.New("missing service name from the request payload")
	}

	if s.Namespace == "" {
		return errors.New("missing service namespace from the request payload")
	}

	if s.Ports == nil {
		return errors.New("missing service ports from the request payload")
	}

	return nil
}

func (r K8sServiceDeleteRequests) Validate(request *http.Request) error {
	if len(r) == 0 {
		return errors.New("missing deletion request list in payload")
	}

	for ns := range r {
		if len(ns) == 0 {
			return errors.New("deletion given with empty namespace")
		}
	}

	return nil
}
