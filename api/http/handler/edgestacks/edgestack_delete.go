package edgestacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/stacks"
	"github.com/portainer/portainer/api/internal/edge"
)

// @id EdgeStackDelete
// @summary Delete an EdgeStack
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @param id path string true "EdgeStack Id"
// @success 204
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks/{id} [delete]
func (handler *Handler) edgeStackDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeStackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid edge stack identifier route variable", err)
	}

	edgeStack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(edgeStackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an edge stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an edge stack with the specified identifier inside the database", err)
	}

	err = handler.protectUpdateSchedule(portainer.EdgeStackID(edgeStackID))
	if err != nil {
		return httperror.BadRequest("Unable to delete edge stack that is used by an edge update schedule", err)
	}

	err = handler.DataStore.EdgeStack().DeleteEdgeStack(portainer.EdgeStackID(edgeStackID))
	if err != nil {
		return httperror.InternalServerError("Unable to remove the edge stack from the database", err)
	}

	relationConfig, err := stacks.FetchEndpointRelationsConfig(handler.DataStore)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environments relations config from database", err)
	}

	relatedEndpointIds, err := edge.EdgeStackRelatedEndpoints(edgeStack.EdgeGroups, relationConfig.Endpoints, relationConfig.EndpointGroups, relationConfig.EdgeGroups)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge stack related environments from database", err)
	}

	for _, endpointID := range relatedEndpointIds {
		relation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpointID)
		if err != nil {
			return httperror.InternalServerError("Unable to find environment relation in database", err)
		}

		delete(relation.EdgeStacks, edgeStack.ID)

		err = handler.DataStore.EndpointRelation().UpdateEndpointRelation(endpointID, relation)
		if err != nil {
			return httperror.InternalServerError("Unable to persist environment relation in database", err)
		}
	}

	return response.Empty(w)
}
