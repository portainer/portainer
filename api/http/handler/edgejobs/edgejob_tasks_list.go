package edgejobs

import (
	"errors"
	"fmt"
	"maps"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/utils/filters"
	"github.com/portainer/portainer/api/internal/edge"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type taskContainer struct {
	ID           string                      `json:"Id"`
	EndpointID   portainer.EndpointID        `json:"EndpointId"`
	EndpointName string                      `json:"EndpointName"`
	LogsStatus   portainer.EdgeJobLogsStatus `json:"LogsStatus"`
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

	params := filters.ExtractListModifiersQueryParams(r)

	var tasks []*taskContainer
	err = handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		tasks, err = listEdgeJobTasks(tx, portainer.EdgeJobID(edgeJobID))
		return err
	})

	return response.TxFuncResponse(err, func() *httperror.HandlerError {
		results := filters.SearchOrderAndPaginate(tasks, params, filters.Config[*taskContainer]{
			SearchAccessors: []filters.SearchAccessor[*taskContainer]{
				func(tc *taskContainer) (string, error) {
					switch tc.LogsStatus {
					case portainer.EdgeJobLogsStatusPending:
						return "pending", nil
					case 0, portainer.EdgeJobLogsStatusIdle:
						return "idle", nil
					case portainer.EdgeJobLogsStatusCollected:
						return "collected", nil
					}
					return "", errors.New("unknown state")
				},
				func(tc *taskContainer) (string, error) {
					return tc.EndpointName, nil
				},
			},
			SortBindings: []filters.SortBinding[*taskContainer]{
				{Key: "EndpointName", Fn: func(a, b *taskContainer) int { return strings.Compare(a.EndpointName, b.EndpointName) }},
			},
		})

		filters.ApplyFilterResultsHeaders(&w, results)

		return response.JSON(w, results.Items)
	})
}

func listEdgeJobTasks(tx dataservices.DataStoreTx, edgeJobID portainer.EdgeJobID) ([]*taskContainer, error) {
	edgeJob, err := tx.EdgeJob().Read(edgeJobID)
	if tx.IsErrObjectNotFound(err) {
		return nil, httperror.NotFound("Unable to find an Edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return nil, httperror.InternalServerError("Unable to find an Edge job with the specified identifier inside the database", err)
	}

	endpoints, err := tx.Endpoint().Endpoints()
	if err != nil {
		return nil, err
	}

	tasks := make([]*taskContainer, 0)

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

		endpointName := ""
		for idx := range endpoints {
			if endpoints[idx].ID == endpointID {
				endpointName = endpoints[idx].Name
			}
		}

		tasks = append(tasks, &taskContainer{
			ID:           fmt.Sprintf("edgejob_task_%d_%d", edgeJob.ID, endpointID),
			EndpointID:   endpointID,
			EndpointName: endpointName,
			LogsStatus:   meta.LogsStatus,
		})
	}

	return tasks, nil
}
