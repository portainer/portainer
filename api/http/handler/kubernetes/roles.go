package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetKubernetesRoles
// @summary Get a list of kubernetes roles
// @description Get a list of kubernetes roles that the user has access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sRole "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of roles."
// @router /kubernetes/{id}/roles [get]
func (handler *Handler) getAllKubernetesRoles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError("an error occurred during the GetAllKubernetesRoles operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	roles, err := cli.GetRoles("")
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetAllKubernetesRoles operation, unable to fetch roles. Error: ", err)
	}

	return response.JSON(w, roles)
}
