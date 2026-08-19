package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetKubernetesJobs
// @summary Get a list of kubernetes Jobs
// @description Get a list of kubernetes Jobs that the user has access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param includeCronJobChildren query bool false "Whether to include Jobs that have a cronjob owner"
// @success 200 {array} models.K8sJob "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of Jobs."
// @router /kubernetes/{id}/jobs [get]
func (handler *Handler) getAllKubernetesJobs(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	includeCronJobChildren, err := request.RetrieveBooleanQueryParameter(r, "includeCronJobChildren", true)
	if err != nil {
		log.Error().Err(err).Str("context", "GetAllKubernetesJobs").Msg("Invalid query parameter includeCronJobChildren")
		return httperror.BadRequest("an error occurred during the GetAllKubernetesJobs operation, invalid query parameter includeCronJobChildren. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetAllKubernetesJobs").Msg("Unable to prepare kube client")
		return httperror.InternalServerError("unable to prepare kube client. Error: ", httpErr)
	}

	jobs, err := cli.GetJobs("", includeCronJobChildren)
	if err != nil {
		log.Error().Err(err).Str("context", "GetAllKubernetesJobs").Msg("Unable to fetch Jobs across all namespaces")
		return httperror.InternalServerError("unable to fetch Jobs. Error: ", err)
	}

	return response.JSON(w, jobs)
}

// @id DeleteJobs
// @summary Delete Jobs
// @description Delete the provided list of Jobs.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @param id path int true "Environment identifier"
// @param payload body models.K8sJobDeleteRequests true "A map where the key is the namespace and the value is an array of Jobs to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific service account."
// @failure 500 "Server error occurred while attempting to delete Jobs."
// @router /kubernetes/{id}/jobs/delete [POST]
func (handler *Handler) deleteKubernetesJobs(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sJobDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.DeleteJobs(payload)
	if err != nil {
		return httperror.InternalServerError("Unable to delete Jobs", err)
	}

	return response.Empty(w)
}
