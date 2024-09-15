package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getAllKubernetesRoles
// @summary Get a list of kubernetes roles within the given environment at the cluster level or a given namespace.
// @description Get a list of kubernetes roles within the given environment at the cluster level or a given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sRole "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
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
