package kubernetes

import "time"

type K8sEvent struct {
	Type               string                 `json:"type"`
	Name               string                 `json:"name"`
	Reason             string                 `json:"reason"`
	Message            string                 `json:"message"`
	Namespace          string                 `json:"namespace"`
	EventTime          time.Time              `json:"eventTime"`
	Kind               string                 `json:"kind,omitempty"`
	Count              int32                  `json:"count"`
	FirstTimestamp     *time.Time             `json:"firstTimestamp,omitempty"`
	LastTimestamp      *time.Time             `json:"lastTimestamp,omitempty"`
	UID                string                 `json:"uid"`
	InvolvedObjectKind K8sEventInvolvedObject `json:"involvedObject"`
}

type K8sEventInvolvedObject struct {
	Kind      string `json:"kind,omitempty"`
	UID       string `json:"uid"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}
