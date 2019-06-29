package endpoints

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type endpointStatusInspectResponse struct {
	Status    string                   `json:"status"`
	Port      int                      `json:"port"`
	Schedules []portainer.EdgeSchedule `json:"schedules"`
}

// GET request on /api/endpoints/:id/status
func (handler *Handler) endpointStatusInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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

	state, port, schedules := handler.ReverseTunnelService.GetTunnelState(endpoint.ID)

	statusResponse := endpointStatusInspectResponse{
		Status:    state,
		Port:      port,
		Schedules: schedules,
	}

	return response.JSON(w, statusResponse)
}
