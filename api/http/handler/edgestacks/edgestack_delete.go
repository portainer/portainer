package edgestacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/stacks"
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

	err = stacks.DeleteEdgeStack(edgeStack.ID, edgeStack.EdgeGroups, handler.DataStore)
	if err != nil {
		return httperror.InternalServerError("Unable to delete edge stack", err)
	}

	return response.Empty(w)
}
