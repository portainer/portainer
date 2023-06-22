package edgejobs

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/maps"
	"github.com/portainer/portainer/pkg/featureflags"
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
// @param id path int true "EdgeJob Id"
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

	var tasks []taskContainer
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		tasks, err = listEdgeJobTasks(handler.DataStore, portainer.EdgeJobID(edgeJobID))
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			tasks, err = listEdgeJobTasks(tx, portainer.EdgeJobID(edgeJobID))
			return err
		})
	}

	return txResponse(w, tasks, err)
}

func listEdgeJobTasks(tx dataservices.DataStoreTx, edgeJobID portainer.EdgeJobID) ([]taskContainer, error) {
	edgeJob, err := tx.EdgeJob().Read(portainer.EdgeJobID(edgeJobID))
	if tx.IsErrObjectNotFound(err) {
		return nil, httperror.NotFound("Unable to find an Edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return nil, httperror.InternalServerError("Unable to find an Edge job with the specified identifier inside the database", err)
	}

	tasks := make([]taskContainer, 0)

	endpointsMap := map[portainer.EndpointID]portainer.EdgeJobEndpointMeta{}
	if len(edgeJob.EdgeGroups) > 0 {
		endpoints, err := edge.GetEndpointsFromEdgeGroups(edgeJob.EdgeGroups, tx)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to get Endpoints from EdgeGroups", err)
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

	return tasks, nil
}
