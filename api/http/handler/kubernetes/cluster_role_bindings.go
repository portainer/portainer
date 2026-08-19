package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetAllKubernetesClusterRoleBindings
// @summary Get a list of kubernetes cluster role bindings
// @description Get a list of kubernetes cluster role bindings within the given environment at the cluster level.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} kubernetes.K8sClusterRoleBinding "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of cluster role bindings."
// @router /kubernetes/{id}/clusterrolebindings [get]
func (handler *Handler) getAllKubernetesClusterRoleBindings(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr.Err).Str("context", "getAllKubernetesClusterRoleBindings").Msg("user is not authorized to fetch cluster role bindings from the Kubernetes cluster.")
		return httperror.Forbidden("User is not authorized to fetch cluster role bindings from the Kubernetes cluster.", httpErr)
	}

	if !cli.GetIsKubeAdmin() {
		log.Error().Str("context", "getAllKubernetesClusterRoleBindings").Msg("user is not authorized to fetch cluster role bindings from the Kubernetes cluster.")
		return httperror.Forbidden("User is not authorized to fetch cluster role bindings from the Kubernetes cluster.", nil)
	}

	clusterrolebindings, err := cli.GetClusterRoleBindings()
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesClusterRoleBindings").Msg("Unable to fetch cluster role bindings.")
		return httperror.InternalServerError("Unable to fetch cluster role bindings.", err)
	}

	return response.JSON(w, clusterrolebindings)
}

// @id DeleteClusterRoleBindings
// @summary Delete cluster role bindings
// @description Delete the provided list of cluster role bindings.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @param id path int true "Environment identifier"
// @param payload body models.K8sClusterRoleBindingDeleteRequests true "A list of cluster role bindings to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific cluster role binding."
// @failure 500 "Server error occurred while attempting to delete cluster role bindings."
// @router /kubernetes/{id}/cluster_role_bindings/delete [POST]
func (handler *Handler) deleteClusterRoleBindings(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sClusterRoleBindingDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.DeleteClusterRoleBindings(payload)
	if err != nil {
		return httperror.InternalServerError("Failed to delete cluster role bindings", err)
	}

	return response.Empty(w)
}
