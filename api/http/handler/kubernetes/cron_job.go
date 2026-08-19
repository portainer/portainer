package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetKubernetesCronJobs
// @summary Get a list of kubernetes Cron Jobs
// @description Get a list of kubernetes Cron Jobs that the user has access to.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sCronJob "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of Cron Jobs."
// @router /kubernetes/{id}/cron_jobs [get]
func (handler *Handler) getAllKubernetesCronJobs(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetAllKubernetesCronJobs").Msg("Unable to prepare kube client")
		return httperror.InternalServerError("unable to prepare kube client. Error: ", httpErr)
	}

	cronJobs, err := cli.GetCronJobs("")
	if err != nil {
		log.Error().Err(err).Str("context", "GetAllKubernetesCronJobs").Msg("Unable to fetch Cron Jobs across all namespaces")
		return httperror.InternalServerError("unable to fetch Cron Jobs. Error: ", err)
	}

	return response.JSON(w, cronJobs)
}

// @id DeleteCronJobs
// @summary Delete Cron Jobs
// @description Delete the provided list of Cron Jobs.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @param id path int true "Environment identifier"
// @param payload body models.K8sCronJobDeleteRequests true "A map where the key is the namespace and the value is an array of Cron Jobs to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific service account."
// @failure 500 "Server error occurred while attempting to delete Cron Jobs."
// @router /kubernetes/{id}/cron_jobs/delete [POST]
func (handler *Handler) deleteKubernetesCronJobs(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload models.K8sCronJobDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	cli, handlerErr := handler.getProxyKubeClient(r)
	if handlerErr != nil {
		return handlerErr
	}

	err = cli.DeleteCronJobs(payload)
	if err != nil {
		return httperror.InternalServerError("Unable to delete Cron Jobs", err)
	}

	return response.Empty(w)
}
