package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getKubernetesClusterRoleBindings
// @summary Get a list of kubernetes clusterrolebindings within the given environment at the cluster level.
// @description Get a list of kubernetes clusterrolebindings within the given environment at the cluster level.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sClusterRoleBinding "Success"
// @router /kubernetes/{id}/clusterrolebindings [get]
func (handler *Handler) getKubernetesClusterRoleBindings(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	if !cli.IsKubeAdmin {
		return httperror.Unauthorized("an error occurred during the GetKubernetesClusterRoleBindings operation, user is not authorized to fetch cluster role bindings from the Kubernetes cluster.", nil)
	}

	clusterrolebindings, err := cli.GetClusterRoleBindings()
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesClusterRoleBindings operation, unable to fetch cluster role bindings. Error: ", err)
	}

	return response.JSON(w, clusterrolebindings)
}
