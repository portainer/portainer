package edgestacks

import (
	"errors"
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/pkg/featureflags"
)

// @id EdgeStackStatusDelete
// @summary Delete an EdgeStack status
// @description Authorized only if the request is done by an Edge Environment(Endpoint)
// @tags edge_stacks
// @produce json
// @param id path int true "EdgeStack Id"
// @param environmentId path int true "Environment identifier"
// @success 200 {object} portainer.EdgeStack
// @failure 500
// @failure 400
// @failure 404
// @failure 403
// @deprecated
// @router /edge_stacks/{id}/status/{environmentId} [delete]
func (handler *Handler) edgeStackStatusDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve a valid endpoint from the handler context", err)
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	var stack *portainer.EdgeStack
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		stack, err = handler.deleteEdgeStackStatus(handler.DataStore, portainer.EdgeStackID(stackID), endpoint)
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			stack, err = handler.deleteEdgeStackStatus(tx, portainer.EdgeStackID(stackID), endpoint)
			return err
		})
	}
	if err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.JSON(w, stack)
}

func (handler *Handler) deleteEdgeStackStatus(tx dataservices.DataStoreTx, stackID portainer.EdgeStackID, endpoint *portainer.Endpoint) (*portainer.EdgeStack, error) {
	stack, err := tx.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
	if err != nil {
		return nil, handler.handlerDBErr(err, "Unable to find a stack with the specified identifier inside the database")
	}

	environmentStatus, ok := stack.Status[endpoint.ID]
	if !ok {
		environmentStatus = portainer.EdgeStackStatus{}
	}

	environmentStatus.Status = append(environmentStatus.Status, portainer.EdgeStackDeploymentStatus{
		Time: time.Now().Unix(),
		Type: portainer.EdgeStackStatusRemoved,
	})

	stack.Status[endpoint.ID] = environmentStatus

	err = tx.EdgeStack().UpdateEdgeStack(stack.ID, stack)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to persist the stack changes inside the database", err)
	}

	return stack, nil
}
