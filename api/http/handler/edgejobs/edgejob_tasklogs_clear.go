package edgejobs

import (
	"errors"
	"net/http"
	"slices"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/edge/cache"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id EdgeJobTasksClear
// @summary Clear the log for a specifc task on an EdgeJob
// @description **Access policy**: administrator
// @tags edge_jobs
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "EdgeJob Id"
// @param taskID path int true "Task Id"
// @success 204
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_jobs/{id}/tasks/{taskID}/logs [delete]
func (handler *Handler) edgeJobTasksClear(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Edge job identifier route variable", err)
	}

	taskID, err := request.RetrieveNumericRouteVariableValue(r, "taskID")
	if err != nil {
		return httperror.BadRequest("Invalid Task identifier route variable", err)
	}

	mutationFn := func(edgeJob *portainer.EdgeJob, endpointID portainer.EndpointID, endpointsFromGroups []portainer.EndpointID) {
		if slices.Contains(endpointsFromGroups, endpointID) {
			edgeJob.GroupLogsCollection[endpointID] = portainer.EdgeJobEndpointMeta{
				CollectLogs: false,
				LogsStatus:  portainer.EdgeJobLogsStatusIdle,
			}
		} else {
			meta := edgeJob.Endpoints[endpointID]
			meta.CollectLogs = false
			meta.LogsStatus = portainer.EdgeJobLogsStatusIdle
			edgeJob.Endpoints[endpointID] = meta
		}
	}

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		updateEdgeJobFn := func(edgeJob *portainer.EdgeJob, endpointID portainer.EndpointID, endpointsFromGroups []portainer.EndpointID) error {
			mutationFn(edgeJob, endpointID, endpointsFromGroups)

			return tx.EdgeJob().Update(edgeJob.ID, edgeJob)
		}

		return handler.clearEdgeJobTaskLogs(tx, portainer.EdgeJobID(edgeJobID), portainer.EndpointID(taskID), updateEdgeJobFn)
	}); err != nil {
		var handlerError *httperror.HandlerError
		if errors.As(err, &handlerError) {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.Empty(w)
}

func (handler *Handler) clearEdgeJobTaskLogs(tx dataservices.DataStoreTx, edgeJobID portainer.EdgeJobID, endpointID portainer.EndpointID, updateEdgeJob func(*portainer.EdgeJob, portainer.EndpointID, []portainer.EndpointID) error) error {
	edgeJob, err := tx.EdgeJob().Read(edgeJobID)
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an Edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an Edge job with the specified identifier inside the database", err)
	}

	if err := handler.FileService.ClearEdgeJobTaskLogs(strconv.Itoa(int(edgeJobID)), strconv.Itoa(int(endpointID))); err != nil {
		return httperror.InternalServerError("Unable to clear log file from disk", err)
	}

	endpointsFromGroups, err := edge.GetEndpointsFromEdgeGroups(edgeJob.EdgeGroups, tx)
	if err != nil {
		return httperror.InternalServerError("Unable to get Endpoints from EdgeGroups", err)
	}

	if err := updateEdgeJob(edgeJob, endpointID, endpointsFromGroups); err != nil {
		return httperror.InternalServerError("Unable to persist Edge job changes in the database", err)
	}

	cache.Del(endpointID)

	return nil
}
