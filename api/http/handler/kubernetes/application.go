package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetApplicationsResources
// @summary Get the total CPU and memory requests and limits of all applications within a namespace
// @description Get the total CPU and memory requests and limits of all applications within a namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} models.K8sApplicationResource "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/metrics/applications_resources [get]
func (handler *Handler) getApplicationsResources(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError("an error occurred during the getApplicationsResources operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	applicationsResources, err := cli.GetApplicationsResource("")
	if err != nil {
		return httperror.InternalServerError("an error occurred during the getApplicationsResources operation, unable to calculate the total resource requests and limits for all applications in the namespace. Error: ", err)
	}

	return response.JSON(w, applicationsResources)
}
