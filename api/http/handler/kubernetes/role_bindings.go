package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetKubernetesRoleBindings
// @summary Get a list of kubernetes role bindings
// @description Get a list of kubernetes role bindings that the user has access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} kubernetes.K8sRoleBinding "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of role bindings."
// @router /kubernetes/{id}/rolebindings [get]
func (handler *Handler) getAllKubernetesRoleBindings(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetAllKubernetesRoleBindings").Msg("Unable to prepare kube client")
		return httperror.InternalServerError("unable to prepare kube client. Error: ", httpErr)
	}

	rolebindings, err := cli.GetRoleBindings("")
	if err != nil {
		log.Error().Err(err).Str("context", "GetAllKubernetesRoleBindings").Msg("Unable to fetch rolebindings")
		return httperror.InternalServerError("unable to fetch rolebindings. Error: ", err)
	}

	return response.JSON(w, rolebindings)
}
