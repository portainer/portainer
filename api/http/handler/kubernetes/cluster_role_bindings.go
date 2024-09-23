package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetAllKubernetesClusterRoleBindings
// @summary Get a list of kubernetes cluster role bindings
// @description Get a list of kubernetes cluster role bindings within the given environment at the cluster level.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sClusterRoleBinding "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of cluster role bindings."
// @router /kubernetes/{id}/clusterrolebindings [get]
func (handler *Handler) getAllKubernetesClusterRoleBindings(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	if !cli.IsKubeAdmin {
		return httperror.Forbidden("an error occurred during the GetAllKubernetesClusterRoleBindings operation, user is not authorized to fetch cluster role bindings from the Kubernetes cluster.", nil)
	}

	clusterrolebindings, err := cli.GetClusterRoleBindings()
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetAllKubernetesClusterRoleBindings operation, unable to fetch cluster role bindings. Error: ", err)
	}

	return response.JSON(w, clusterrolebindings)
}
