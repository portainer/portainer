package edgejobs

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/maps"
	"github.com/rs/zerolog/log"
)

// @id EdgeJobDelete
// @summary Delete an EdgeJob
// @description **Access policy**: administrator
// @tags edge_jobs
// @security ApiKeyAuth
// @security jwt
// @param id path string true "EdgeJob Id"
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

	edgeJob, err := handler.DataStore.EdgeJob().EdgeJob(portainer.EdgeJobID(edgeJobID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an Edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an Edge job with the specified identifier inside the database", err)
	}

	edgeJobFolder := handler.FileService.GetEdgeJobFolder(strconv.Itoa(edgeJobID))
	err = handler.FileService.RemoveDirectory(edgeJobFolder)
	if err != nil {
		log.Warn().Err(err).Msg("Unable to remove the files associated to the Edge job on the filesystem")
	}

	handler.ReverseTunnelService.RemoveEdgeJob(edgeJob.ID)

	var endpointsMap map[portainer.EndpointID]portainer.EdgeJobEndpointMeta
	if len(edgeJob.EdgeGroups) > 0 {
		endpoints, err := edge.GetEndpointsFromEdgeGroups(edgeJob.EdgeGroups, handler.DataStore)
		if err != nil {
			return httperror.InternalServerError("Unable to get Endpoints from EdgeGroups", err)
		}

		endpointsMap = convertEndpointsToMetaObject(endpoints)
		maps.Copy(endpointsMap, edgeJob.Endpoints)
	} else {
		endpointsMap = edgeJob.Endpoints
	}

	for endpointID := range endpointsMap {
		handler.ReverseTunnelService.RemoveEdgeJobFromEndpoint(endpointID, edgeJob.ID)
	}

	err = handler.DataStore.EdgeJob().DeleteEdgeJob(edgeJob.ID)
	if err != nil {
		return httperror.InternalServerError("Unable to remove the Edge job from the database", err)
	}

	return response.Empty(w)
}
