package endpointedge

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
)

type logsPayload struct {
	FileContent string
}

func (payload *logsPayload) Validate(r *http.Request) error {
	return nil
}

// endpointEdgeJobsLogs
// @summary Inspect an EdgeJob Log
// @description
// @tags edge, endpoints
// @accept json
// @produce json
// @param id path string true "Endpoint Id"
// @param jobID path string true "Job Id"
// @success 200
// @failure 500
// @failure 400
// @router /endpoints/{id}/edge/jobs/{jobID}/logs [post]
func (handler *Handler) endpointEdgeJobsLogs(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "jobID")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid edge job identifier route variable", err}
	}

	var payload logsPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	edgeJob, err := handler.DataStore.EdgeJob().EdgeJob(portainer.EdgeJobID(edgeJobID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an edge job with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an edge job with the specified identifier inside the database", err}
	}

	err = handler.FileService.StoreEdgeJobTaskLogFileFromBytes(strconv.Itoa(edgeJobID), strconv.Itoa(endpointID), []byte(payload.FileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to save task log to the filesystem", err}
	}

	meta := edgeJob.Endpoints[endpoint.ID]
	meta.CollectLogs = false
	meta.LogsStatus = portainer.EdgeJobLogsStatusCollected
	edgeJob.Endpoints[endpoint.ID] = meta

	err = handler.DataStore.EdgeJob().UpdateEdgeJob(edgeJob.ID, edgeJob)

	handler.ReverseTunnelService.AddEdgeJob(endpoint.ID, edgeJob)

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist edge job changes to the database", err}
	}

	return response.JSON(w, nil)
}
