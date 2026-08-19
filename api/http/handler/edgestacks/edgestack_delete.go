package edgestacks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
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
	edgeStackIDParam, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid edge stack identifier route variable", err)
	}

	edgeStackID := portainer.EdgeStackID(edgeStackIDParam)
	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		edgeStack, txErr := tx.EdgeStack().EdgeStack(edgeStackID)
		if tx.IsErrObjectNotFound(txErr) {
			return httperror.NotFound("Unable to find an edge stack with the specified identifier inside the database", txErr)
		} else if txErr != nil {
			return httperror.InternalServerError("Unable to find an edge stack with the specified identifier inside the database", txErr)
		}

		if err := handler.edgeStacksService.DeleteRecords(tx, edgeStack); err != nil {
			return httperror.InternalServerError("Unable to delete edge stack", err)
		}

		return nil
	})

	if err == nil {
		if err := handler.edgeStacksService.CleanupAfterDelete(edgeStackID); err != nil {
			log.Warn().Err(err).Msg("unable to remove edge stack project files after edge stack deletion")
		}
	}

	return response.TxEmptyResponse(w, err)
}
