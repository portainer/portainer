package kubernetes

import "time"

type K8sClusterRole struct {
	Name         string    `json:"name"`
	CreationDate time.Time `json:"creationDate"`
	Uid          string    `json:"uid"`
	IsSystem     bool      `json:"isSystem"`
}
