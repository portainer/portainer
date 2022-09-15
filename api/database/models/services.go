package models

import (
	"errors"
	"net/http"
)

type (
	K8sServiceInfo struct {
		Name                          string              `json:"Name"`
		UID                           string              `json:"UID"`
		Type                          string              `json:"Type"`
		Namespace                     string              `json:"Namespace"`
		Annotations                   map[string]string   `json:"Annotations"`
		CreationTimestamp             string              `json:"CreationTimestamp"`
		Labels                        map[string]string   `json:"Labels"`
		AllocateLoadBalancerNodePorts *bool               `json:"AllocateLoadBalancerNodePorts,omitempty"`
		Ports                         []K8sServicePort    `json:"Ports"`
		Selector                      map[string]string   `json:"Selector"`
		IngressStatus                 []K8sServiceIngress `json:"IngressStatus"`
	}

	K8sServicePort struct {
		Name       string `json:"Name"`
		NodePort   int    `json:"NodePort"`
		Port       int    `json:"Port"`
		Protocol   string `json:"Protocol"`
		TargetPort int    `json:"TargetPort"`
	}

	K8sServiceIngress struct {
		IP   string `json:"IP"`
		Host string `json:"Host"`
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
