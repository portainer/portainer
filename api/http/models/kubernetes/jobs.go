package kubernetes

import (
	"errors"
	"net/http"

	corev1 "k8s.io/api/core/v1"
)

// K8sJob struct
type K8sJob struct {
	ID           string           `json:"Id"`
	Namespace    string           `json:"Namespace"`
	Name         string           `json:"Name"`
	PodName      string           `json:"PodName"`
	Container    corev1.Container `json:"Container,omitzero"`
	Command      string           `json:"Command,omitempty"`
	BackoffLimit int32            `json:"BackoffLimit,omitempty"`
	Completions  int32            `json:"Completions,omitempty"`
	StartTime    string           `json:"StartTime"`
	FinishTime   string           `json:"FinishTime"`
	Duration     string           `json:"Duration"`
	Status       string           `json:"Status"`
	FailedReason string           `json:"FailedReason"`
	IsSystem     bool             `json:"IsSystem"`
}

type (
	K8sJobDeleteRequests map[string][]string
)

func (r K8sJobDeleteRequests) Validate(request *http.Request) error {
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
