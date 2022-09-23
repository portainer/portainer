package models

import (
	"errors"
	"net/http"
)

type (
	K8sIngressController struct {
		Name         string `json:"Name"`
		ClassName    string `json:"ClassName"`
		Type         string `json:"Type"`
		Availability bool   `json:"Availability"`
		New          bool   `json:"New"`
	}

	K8sIngressControllers []K8sIngressController

	K8sIngressInfo struct {
		Name        string            `json:"Name"`
		UID         string            `json:"UID"`
		Type        string            `json:"Type"`
		Namespace   string            `json:"Namespace"`
		ClassName   string            `json:"ClassName"`
		Annotations map[string]string `json:"Annotations"`
		Hosts       []string          `json:"Hosts"`
		Paths       []K8sIngressPath  `json:"Paths"`
		TLS         []K8sIngressTLS   `json:"TLS"`
	}

	K8sIngressTLS struct {
		Hosts      []string `json:"Hosts"`
		SecretName string   `json:"SecretName"`
	}

	K8sIngressPath struct {
		IngressName string `json:"IngressName"`
		Host        string `json:"Host"`
		ServiceName string `json:"ServiceName"`
		Port        int    `json:"Port"`
		Path        string `json:"Path"`
		PathType    string `json:"PathType"`
	}

	// K8sIngressDeleteRequests is a mapping of namespace names to a slice of
	// ingress names.
	K8sIngressDeleteRequests map[string][]string
)

func (r K8sIngressControllers) Validate(request *http.Request) error {
	return nil
}

func (r K8sIngressInfo) Validate(request *http.Request) error {
	if r.Name == "" {
		return errors.New("missing ingress name from the request payload")
	}
	if r.Namespace == "" {
		return errors.New("missing ingress Namespace from the request payload")
	}
	if r.ClassName == "" {
		return errors.New("missing ingress ClassName from the request payload")
	}
	return nil
}

func (r K8sIngressDeleteRequests) Validate(request *http.Request) error {
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
