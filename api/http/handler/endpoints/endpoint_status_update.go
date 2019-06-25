package endpoints

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type endpointStatusUpdatePayload struct {
	Status string
}

func (payload *endpointStatusUpdatePayload) Validate(r *http.Request) error {
	switch payload.Status {
	case
		portainer.EdgeAgentActive, portainer.EdgeAgentIdle, portainer.EdgeAgentManagementRequired:
	default:
		return portainer.Error("Invalid status value.")
	}

	return nil
}

// TODO: document in Swagger
// GET request on /api/endpoints/:id/status
func (handler *Handler) endpointStatusUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	if endpoint.Type != portainer.EdgeAgentEnvironment {
		return &httperror.HandlerError{http.StatusInternalServerError, "Status unavailable for non Edge agent endpoints", errors.New("Status unavailable")}
	}

	var payload endpointStatusUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	handler.ReverseTunnelService.UpdateTunnelState(endpoint.ID, payload.Status)

	return response.Empty(w)
}
