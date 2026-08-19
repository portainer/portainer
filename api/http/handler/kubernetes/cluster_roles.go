package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetAllKubernetesClusterRoles
// @summary Get a list of kubernetes cluster roles
// @description Get a list of kubernetes cluster roles within the given environment at the cluster level.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} kubernetes.K8sClusterRole "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of cluster roles."
// @router /kubernetes/{id}/clusterroles [get]
func (handler *Handler) getAllKubernetesClusterRoles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr.Err).Str("context", "getAllKubernetesClusterRoles").Msg("user is not authorized to fetch cluster roles from the Kubernetes cluster.")
		return httperror.Forbidden("User is not authorized to fetch cluster roles from the Kubernetes cluster.", httpErr)
	}

	if !cli.GetIsKubeAdmin() {
		log.Error().Str("context", "getAllKubernetesClusterRoles").Msg("user is not authorized to fetch cluster roles from the Kubernetes cluster.")
		return httperror.Forbidden("User is not authorized to fetch cluster roles from the Kubernetes cluster.", nil)
	}

	clusterroles, err := cli.GetClusterRoles()
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesClusterRoles").Msg("Unable to fetch clusterroles.")
		return httperror.InternalServerError("Unable to fetch clusterroles.", err)
	}

	return response.JSON(w, clusterroles)
}

// @id DeleteClusterRoles
// @summary Delete cluster roles
// @description Delete the provided list of cluster roles.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @param id path int true "Environment identifier"
// @param payload body models.K8sClusterRoleDeleteRequests true "A list of cluster roles to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific cluster role."
// @failure 500 "Server error occurred while attempting to delete cluster roles."
// @router /kubernetes/{id}/cluster_roles/delete [POST]
func (handler *Handler) deleteClusterRoles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sClusterRoleDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.DeleteClusterRoles(payload)
	if err != nil {
		return httperror.InternalServerError("Failed to delete cluster roles", err)
	}

	return response.Empty(w)
}
