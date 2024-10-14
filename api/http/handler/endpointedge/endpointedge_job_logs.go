package endpointedge

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/internal/edge/cache"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
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

	if err := handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint); err != nil {
		return httperror.Forbidden("Permission denied to access environment", fmt.Errorf("unauthorized edge endpoint operation: %w. Environment name: %s", err, endpoint.Name))
	}

	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "jobID")
	if err != nil {
		return httperror.BadRequest("Invalid edge job identifier route variable", fmt.Errorf("invalid Edge job route variable: %w. Environment name: %s", err, endpoint.Name))
	}

	var payload logsPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", fmt.Errorf("invalid Edge job request payload: %w. Environment name: %s", err, endpoint.Name))
	}

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return handler.getEdgeJobLobs(tx, endpoint.ID, portainer.EdgeJobID(edgeJobID), payload)
	}); err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			httpErr.Err = fmt.Errorf("edge polling error: %w. Environment name: %s", httpErr.Err, endpoint.Name)
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", fmt.Errorf("edge polling error: %w. Environment name: %s", err, endpoint.Name))
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

	edgeJob, err := tx.EdgeJob().Read(edgeJobID)
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an edge job with the specified identifier inside the database", err)
	}

	if err := handler.FileService.StoreEdgeJobTaskLogFileFromBytes(strconv.Itoa(int(edgeJobID)), strconv.Itoa(int(endpoint.ID)), []byte(payload.FileContent)); err != nil {
		return httperror.InternalServerError("Unable to save task log to the filesystem", err)
	}

	meta := portainer.EdgeJobEndpointMeta{CollectLogs: false, LogsStatus: portainer.EdgeJobLogsStatusCollected}
	if _, ok := edgeJob.GroupLogsCollection[endpoint.ID]; ok {
		edgeJob.GroupLogsCollection[endpoint.ID] = meta
	} else {
		edgeJob.Endpoints[endpoint.ID] = meta
	}

	if err := tx.EdgeJob().Update(edgeJob.ID, edgeJob); err != nil {
		return httperror.InternalServerError("Unable to persist edge job changes to the database", err)
	}

	cache.Del(endpointID)

	return nil
}
