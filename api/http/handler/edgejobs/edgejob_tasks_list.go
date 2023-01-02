package edgejobs

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/maps"
)

type taskContainer struct {
	ID         string                      `json:"Id"`
	EndpointID portainer.EndpointID        `json:"EndpointId"`
	LogsStatus portainer.EdgeJobLogsStatus `json:"LogsStatus"`
}

// @id EdgeJobTasksList
// @summary Fetch the list of tasks on an EdgeJob
// @description **Access policy**: administrator
// @tags edge_jobs
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path string true "EdgeJob Id"
// @success 200 {array} taskContainer
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_jobs/{id}/tasks [get]
func (handler *Handler) edgeJobTasksList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Edge job identifier route variable", err)
	}

	edgeJob, err := handler.DataStore.EdgeJob().EdgeJob(portainer.EdgeJobID(edgeJobID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an Edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an Edge job with the specified identifier inside the database", err)
	}

	tasks := make([]taskContainer, 0)

	endpointsMap := map[portainer.EndpointID]portainer.EdgeJobEndpointMeta{}
	if len(edgeJob.EdgeGroups) > 0 {
		endpoints, err := edge.GetEndpointsFromEdgeGroups(edgeJob.EdgeGroups, handler.DataStore)
		if err != nil {
			return httperror.InternalServerError("Unable to get Endpoints from EdgeGroups", err)
		}

		endpointsMap = convertEndpointsToMetaObject(endpoints)
		maps.Copy(endpointsMap, edgeJob.GroupLogsCollection)
	}

	maps.Copy(endpointsMap, edgeJob.Endpoints)

	for endpointID, meta := range endpointsMap {
		tasks = append(tasks, taskContainer{
			ID:         fmt.Sprintf("edgejob_task_%d_%d", edgeJob.ID, endpointID),
			EndpointID: endpointID,
			LogsStatus: meta.LogsStatus,
		})
	}

	return response.JSON(w, tasks)
}
