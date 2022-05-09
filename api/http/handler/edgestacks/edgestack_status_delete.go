package edgestacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
)

func (handler *Handler) handlerDBErr(err error, msg string) *httperror.HandlerError {
	httpErr := &httperror.HandlerError{http.StatusInternalServerError, msg, err}

	if handler.DataStore.IsErrObjectNotFound(err) {
		httpErr.StatusCode = http.StatusNotFound
	}

	return httpErr
}

// @id EdgeStackStatusDelete
// @summary Delete an EdgeStack status
// @description Authorized only if the request is done by an Edge Environment(Endpoint)
// @tags edge_stacks
// @produce json
// @param id path string true "EdgeStack Id"
// @success 200 {object} portainer.EdgeStack
// @failure 500
// @failure 400
// @failure 404
// @failure 403
// @router /edge_stacks/{id}/status/{endpoint_id} [delete]
func (handler *Handler) edgeStackStatusDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a valid endpoint from the handler context", err}
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	stack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
	if err != nil {
		return handler.handlerDBErr(err, "Unable to find a stack with the specified identifier inside the database")
	}

	delete(stack.Status, endpoint.ID)

	err = handler.DataStore.EdgeStack().UpdateEdgeStack(stack.ID, stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack changes inside the database", err}
	}

	return response.JSON(w, stack)
}
