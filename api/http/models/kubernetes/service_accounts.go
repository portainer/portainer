package kubernetes

import "time"

type K8sServiceAccount struct {
	Name         string    `json:"name"`
	Namespace    string    `json:"namespace"`
	CreationDate time.Time `json:"creationDate"`
}
