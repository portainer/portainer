package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getKubernetesClusterRoles
// @summary Get a list of kubernetes clusterroles within the given environment at the cluster level.
// @description Get a list of kubernetes clusterroles within the given environment at the cluster level.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sClusterRole "Success"
// @router /kubernetes/{id}/clusterroles [get]
func (handler *Handler) getKubernetesClusterRoles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	if !cli.IsKubeAdmin {
		return httperror.Unauthorized("an error occurred during the GetKubernetesClusterRoles operation, user is not authorized to fetch cluster roles from the Kubernetes cluster.", nil)
	}

	clusterroles, err := cli.GetClusterRoles()
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesClusterRoles operation, unable to fetch clusterroles. Error: ", err)
	}

	return response.JSON(w, clusterroles)
}
