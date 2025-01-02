package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetKubernetesRBACStatus
// @summary Check if RBAC is enabled
// @description Check if RBAC is enabled in the specified Kubernetes cluster.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {boolean} bool "RBAC status"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the RBAC status."
// @router /kubernetes/{id}/rbac_enabled [get]
func (handler *Handler) getKubernetesRBACStatus(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		log.Error().Err(handlerErr).Str("context", "GetKubernetesRBACStatus").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user. Error: ", handlerErr)
	}

	isRBACEnabled, err := cli.IsRBACEnabled()
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesRBACStatus").Msg("Failed to check RBAC status")
		return httperror.InternalServerError("Failed to check RBAC status", err)
	}

	return response.JSON(w, isRBACEnabled)
}
