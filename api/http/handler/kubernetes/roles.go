package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetKubernetesRoles
// @summary Get a list of kubernetes roles
// @description Get a list of kubernetes roles that the user has access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} kubernetes.K8sRole "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of roles."
// @router /kubernetes/{id}/roles [get]
func (handler *Handler) getAllKubernetesRoles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetAllKubernetesRoles").Msg("Unable to prepare kube client")
		return httperror.InternalServerError("unable to prepare kube client. Error: ", httpErr)
	}

	roles, err := cli.GetRoles("")
	if err != nil {
		log.Error().Err(err).Str("context", "GetAllKubernetesRoles").Msg("Unable to fetch roles across all namespaces")
		return httperror.InternalServerError("unable to fetch roles across all namespaces. Error: ", err)
	}

	return response.JSON(w, roles)
}

// @id DeleteRoles
// @summary Delete roles
// @description Delete the provided list of roles.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @param id path int true "Environment identifier"
// @param payload body models.K8sRoleDeleteRequests true "A map where the key is the namespace and the value is an array of roles to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific role."
// @failure 500 "Server error occurred while attempting to delete roles."
// @router /kubernetes/{id}/roles/delete [POST]
func (h *Handler) deleteRoles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sRoleDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := h.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.DeleteRoles(payload)
	if err != nil {
		return httperror.InternalServerError("Failed to delete roles", err)
	}

	return response.Empty(w)
}
