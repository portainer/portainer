package edgestacks

import (
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id EdgeStackDelete
// @summary Delete an EdgeStack
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @param id path int true "EdgeStack Id"
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

	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return handler.deleteEdgeStack(tx, portainer.EdgeStackID(edgeStackID))
	})

	return response.TxEmptyResponse(w, err)
}

func (handler *Handler) deleteEdgeStack(tx dataservices.DataStoreTx, edgeStackID portainer.EdgeStackID) error {
	edgeStack, err := tx.EdgeStack().EdgeStack(edgeStackID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an edge stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an edge stack with the specified identifier inside the database", err)
	}

	if err := handler.edgeStacksService.DeleteEdgeStack(tx, edgeStack.ID, edgeStack.EdgeGroups); err != nil {
		return httperror.InternalServerError("Unable to delete edge stack", err)
	}

	stackFolder := handler.FileService.GetEdgeStackProjectPath(strconv.Itoa(int(edgeStack.ID)))
	if err := handler.FileService.RemoveDirectory(stackFolder); err != nil {
		return httperror.InternalServerError("Unable to remove edge stack project folder", err)
	}

	return nil
}
