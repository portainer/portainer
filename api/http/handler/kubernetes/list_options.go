package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/pkg/libhttp/request"
)

// parseK8sListOptions builds the shared resource list options from the request
// query parameters. Central place to extend as K8sResourceListOptions grows.
func parseK8sListOptions(r *http.Request) models.K8sResourceListOptions {
	labelSelector, _ := request.RetrieveQueryParameter(r, "labelSelector", true)
	fieldSelector, _ := request.RetrieveQueryParameter(r, "fieldSelector", true)

	return models.K8sResourceListOptions{
		LabelSelector: labelSelector,
		FieldSelector: fieldSelector,
	}
}
