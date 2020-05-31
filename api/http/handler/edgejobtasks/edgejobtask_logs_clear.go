package edgejobtasks

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// DELETE request on /api/edge_jobs/:id/tasks/:taskID/logs
func (handler *Handler) edgeJobTasksClear(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to retrieve settings", err}
	}

	if !settings.EnableEdgeComputeFeatures {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Edge compute features are disabled", portainer.ErrHostManagementFeaturesDisabled}
	}

	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid Edge job identifier route variable", err}
	}

	taskID, err := request.RetrieveNumericRouteVariableValue(r, "taskID")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid Task identifier route variable", err}
	}

	edgeJob, err := handler.DataStore.EdgeJob().EdgeJob(portainer.EdgeJobID(edgeJobID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an Edge job with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an Edge job with the specified identifier inside the database", err}
	}

	endpointID := portainer.EndpointID(taskID)

	edgeJob.Endpoints[endpointID] = portainer.EdgeJobEndpointMeta{
		CollectLogs: false,
		LogsStatus:  portainer.EdgeJobLogsStatusIdle,
	}

	err = handler.FileService.ClearEdgeJobTaskLogs(strconv.Itoa(edgeJobID), strconv.Itoa(taskID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to clear log file from disk", err}
	}

	err = handler.DataStore.EdgeJob().UpdateEdgeJob(edgeJob.ID, edgeJob)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist Edge job changes in the database", err}
	}

	return response.Empty(w)
}
