package kubernetes

import (
	"errors"
	"net/http"
)

type K8sCronJob struct {
	Id        string   `json:"Id"`
	Name      string   `json:"Name"`
	Namespace string   `json:"Namespace"`
	Command   string   `json:"Command"`
	Schedule  string   `json:"Schedule"`
	Timezone  string   `json:"Timezone"`
	Suspend   bool     `json:"Suspend"`
	Jobs      []K8sJob `json:"Jobs"`
	IsSystem  bool     `json:"IsSystem"`
}

type (
	K8sCronJobDeleteRequests map[string][]string
)

func (r K8sCronJobDeleteRequests) Validate(request *http.Request) error {
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
