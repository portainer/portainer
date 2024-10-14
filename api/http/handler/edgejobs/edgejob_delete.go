package edgejobs

import (
	"errors"
	"maps"
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/edge/cache"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

// @id EdgeJobDelete
// @summary Delete an EdgeJob
// @description **Access policy**: administrator
// @tags edge_jobs
// @security ApiKeyAuth
// @security jwt
// @param id path int true "EdgeJob Id"
// @success 204
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_jobs/{id} [delete]
func (handler *Handler) edgeJobDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Edge job identifier route variable", err)
	}

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return handler.deleteEdgeJob(tx, portainer.EdgeJobID(edgeJobID))
	}); err != nil {
		var handlerError *httperror.HandlerError
		if errors.As(err, &handlerError) {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.Empty(w)
}

func (handler *Handler) deleteEdgeJob(tx dataservices.DataStoreTx, edgeJobID portainer.EdgeJobID) error {
	edgeJob, err := tx.EdgeJob().Read(edgeJobID)
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an Edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an Edge job with the specified identifier inside the database", err)
	}

	edgeJobFolder := handler.FileService.GetEdgeJobFolder(strconv.Itoa(int(edgeJobID)))
	if err := handler.FileService.RemoveDirectory(edgeJobFolder); err != nil {
		log.Warn().Err(err).Msg("Unable to remove the files associated to the Edge job on the filesystem")
	}

	var endpointsMap map[portainer.EndpointID]portainer.EdgeJobEndpointMeta
	if len(edgeJob.EdgeGroups) > 0 {
		endpoints, err := edge.GetEndpointsFromEdgeGroups(edgeJob.EdgeGroups, tx)
		if err != nil {
			return httperror.InternalServerError("Unable to get Endpoints from EdgeGroups", err)
		}

		endpointsMap = convertEndpointsToMetaObject(endpoints)
		maps.Copy(endpointsMap, edgeJob.Endpoints)
	} else {
		endpointsMap = edgeJob.Endpoints
	}

	for endpointID := range endpointsMap {
		cache.Del(endpointID)
	}

	if err := tx.EdgeJob().Delete(edgeJob.ID); err != nil {
		return httperror.InternalServerError("Unable to remove the Edge job from the database", err)
	}

	return nil
}
