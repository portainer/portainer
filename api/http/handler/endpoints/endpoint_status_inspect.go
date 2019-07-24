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
	Status          string                   `json:"status"`
	Port            int                      `json:"port"`
	Schedules       []portainer.EdgeSchedule `json:"schedules"`
	CheckinInterval int                      `json:"checkin"`
	Credentials     string                   `json:"credentials"`
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

	edgeIdentifier := r.Header.Get(portainer.PortainerAgentEdgeIDHeader)
	if edgeIdentifier == "" {
		return &httperror.HandlerError{http.StatusForbidden, "Missing Edge identifier", errors.New("missing Edge identifier")}
	}

	if endpoint.EdgeID != "" && endpoint.EdgeID != edgeIdentifier {
		return &httperror.HandlerError{http.StatusForbidden, "Invalid Edge identifier", errors.New("invalid Edge identifier")}
	}

	if endpoint.EdgeID == "" {
		endpoint.EdgeID = edgeIdentifier

		err := handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to Unable to persist endpoint changes inside the database", err}
		}
	}

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	tunnel := handler.ReverseTunnelService.GetTunnelDetails(endpoint.ID)

	statusResponse := endpointStatusInspectResponse{
		Status:          tunnel.Status,
		Port:            tunnel.Port,
		Schedules:       tunnel.Schedules,
		CheckinInterval: settings.EdgeAgentCheckinInterval,
		Credentials:     tunnel.Credentials,
	}

	if tunnel.Status == portainer.EdgeAgentManagementRequired {
		handler.ReverseTunnelService.SetTunnelStatusToActive(endpoint.ID)
	}

	return response.JSON(w, statusResponse)
}
