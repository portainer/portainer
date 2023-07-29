package endpointedge

import (
	"errors"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/pkg/featureflags"
)

type logsPayload struct {
	FileContent string
}

func (payload *logsPayload) Validate(r *http.Request) error {
	return nil
}

// endpointEdgeJobsLogs
// @summary Inspect an EdgeJob Log
// @description **Access policy**: public
// @tags edge, endpoints
// @accept json
// @produce json
// @param id path int true "environment(endpoint) Id"
// @param jobID path int true "Job Id"
// @success 200
// @failure 500
// @failure 400
// @router /endpoints/{id}/edge/jobs/{jobID}/logs [post]
func (handler *Handler) endpointEdgeJobsLogs(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.BadRequest("Unable to find an environment on request context", err)
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "jobID")
	if err != nil {
		return httperror.BadRequest("Invalid edge job identifier route variable", err)
	}

	var payload logsPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		err = handler.getEdgeJobLobs(handler.DataStore, endpoint.ID, portainer.EdgeJobID(edgeJobID), payload)
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return handler.getEdgeJobLobs(tx, endpoint.ID, portainer.EdgeJobID(edgeJobID), payload)
		})
	}

	if err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.JSON(w, nil)
}

func (handler *Handler) getEdgeJobLobs(tx dataservices.DataStoreTx, endpointID portainer.EndpointID, edgeJobID portainer.EdgeJobID, payload logsPayload) error {
	endpoint, err := tx.Endpoint().Endpoint(endpointID)
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	edgeJob, err := tx.EdgeJob().Read(portainer.EdgeJobID(edgeJobID))
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an edge job with the specified identifier inside the database", err)
	}

	err = handler.FileService.StoreEdgeJobTaskLogFileFromBytes(strconv.Itoa(int(edgeJobID)), strconv.Itoa(int(endpointID)), []byte(payload.FileContent))
	if err != nil {
		return httperror.InternalServerError("Unable to save task log to the filesystem", err)
	}

	meta := portainer.EdgeJobEndpointMeta{CollectLogs: false, LogsStatus: portainer.EdgeJobLogsStatusCollected}
	if _, ok := edgeJob.GroupLogsCollection[endpoint.ID]; ok {
		edgeJob.GroupLogsCollection[endpoint.ID] = meta
	} else {
		edgeJob.Endpoints[endpoint.ID] = meta
	}

	err = tx.EdgeJob().Update(edgeJob.ID, edgeJob)

	handler.ReverseTunnelService.AddEdgeJob(endpoint, edgeJob)

	if err != nil {
		return httperror.InternalServerError("Unable to persist edge job changes to the database", err)
	}

	return nil
}
