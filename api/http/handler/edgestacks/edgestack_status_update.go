package edgestacks

import (
	"errors"
	"net/http"

	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
)

type updateStatusPayload struct {
	Error      string
	Status     *portainer.EdgeStackStatusType
	EndpointID portainer.EndpointID
}

func (payload *updateStatusPayload) Validate(r *http.Request) error {
	if payload.Status == nil {
		return errors.New("Invalid status")
	}

	if payload.EndpointID == 0 {
		return errors.New("Invalid EnvironmentID")
	}

	if *payload.Status == portainer.EdgeStackStatusError && govalidator.IsNull(payload.Error) {
		return errors.New("Error message is mandatory when status is error")
	}

	return nil
}

// @id EdgeStackStatusUpdate
// @summary Update an EdgeStack status
// @description Authorized only if the request is done by an Edge Environment(Endpoint)
// @tags edge_stacks
// @accept json
// @produce json
// @param id path int true "EdgeStack Id"
// @success 200 {object} portainer.EdgeStack
// @failure 500
// @failure 400
// @failure 404
// @failure 403
// @router /edge_stacks/{id}/status [put]
func (handler *Handler) edgeStackStatusUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	var payload updateStatusPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(payload.EndpointID)
	if err != nil {
		return handler.handlerDBErr(err, "Unable to find an environment with the specified identifier inside the database")
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	var stack portainer.EdgeStack

	err = handler.DataStore.EdgeStack().UpdateEdgeStackFunc(portainer.EdgeStackID(stackID), func(edgeStack *portainer.EdgeStack) {
		details := edgeStack.Status[payload.EndpointID].Details
		details.Pending = false

		switch *payload.Status {
		case portainer.EdgeStackStatusOk:
			details.Ok = true
		case portainer.EdgeStackStatusError:
			details.Error = true
		case portainer.EdgeStackStatusAcknowledged:
			details.Acknowledged = true
		case portainer.EdgeStackStatusRemove:
			details.Remove = true
		case portainer.EdgeStackStatusImagesPulled:
			details.ImagesPulled = true
		}

		edgeStack.Status[payload.EndpointID] = portainer.EdgeStackStatus{
			Details:    details,
			Error:      payload.Error,
			EndpointID: payload.EndpointID,
		}

		stack = *edgeStack
	})
	if err != nil {
		return handler.handlerDBErr(err, "Unable to persist the stack changes inside the database")
	}

	return response.JSON(w, stack)
}
