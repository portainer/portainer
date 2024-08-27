package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getAllKubernetesClusterRoles
// @summary Get a list of kubernetes cluster roles within the given environment at the cluster level.
// @description Get a list of kubernetes cluster roles within the given environment at the cluster level.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sClusterRole "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve the list of cluster roles."
// @router /kubernetes/{id}/clusterroles [get]
func (handler *Handler) getAllKubernetesClusterRoles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	if !cli.IsKubeAdmin {
		return httperror.Unauthorized("an error occurred during the GetAllKubernetesClusterRoles operation, user is not authorized to fetch cluster roles from the Kubernetes cluster.", nil)
	}

	clusterroles, err := cli.GetClusterRoles()
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetAllKubernetesClusterRoles operation, unable to fetch clusterroles. Error: ", err)
	}

	return response.JSON(w, clusterroles)
}
