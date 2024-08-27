package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getAllKubernetesClusterRoleBindings
// @summary Get a list of kubernetes cluster role bindings within the given environment at the cluster level.
// @description Get a list of kubernetes cluster role bindings within the given environment at the cluster level.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {object} []models.K8sClusterRoleBinding "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve the list of cluster role bindings."
// @router /kubernetes/{id}/clusterrolebindings [get]
func (handler *Handler) getAllKubernetesClusterRoleBindings(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	if !cli.IsKubeAdmin {
		return httperror.Unauthorized("an error occurred during the GetAllKubernetesClusterRoleBindings operation, user is not authorized to fetch cluster role bindings from the Kubernetes cluster.", nil)
	}

	clusterrolebindings, err := cli.GetClusterRoleBindings()
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetAllKubernetesClusterRoleBindings operation, unable to fetch cluster role bindings. Error: ", err)
	}

	return response.JSON(w, clusterrolebindings)
}
