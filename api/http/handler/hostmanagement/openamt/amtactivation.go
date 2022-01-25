package openamt

import (
	"errors"
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

// @id openAMTActivate
// @summary Activate OpenAMT device and associate to agent endpoint
// @description Activate OpenAMT device and associate to agent endpoint
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open_amt/{id}/activate [post]
func (handler *Handler) openAMTActivate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an endpoint with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an endpoint with the specified identifier inside the database", Err: err}
	} else if !endpointutils.IsAgentEndpoint(endpoint) {
		errMsg := fmt.Sprintf("%s is not an agent environment", endpoint.Name)
		return &httperror.HandlerError{http.StatusBadRequest, errMsg, errors.New(errMsg)}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	err = handler.activateDevice(endpoint, *settings)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to activate device", err}
	}

	hostInfo, _, err := handler.getEndpointAMTInfo(endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve AMT information", Err: err}
	}
	if hostInfo.ControlModeRaw < 1 {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to activate device", Err: errors.New("failed to activate device")}
	}
	if hostInfo.UUID == "" {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve device UUID", Err: errors.New("unable to retrieve device UUID")}
	}

	endpoint.AMTDeviceGUID = hostInfo.UUID
	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist environment changes inside the database", err}
	}

	return response.Empty(w)
}
