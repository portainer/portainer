package openamt

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
)

type Devices struct {
	Devices []portainer.OpenAMTDeviceInformation
}

// @id OpenAMTDevices
// @summary Fetch OpenAMT managed devices information for endpoint
// @description Fetch OpenAMT managed devices information for endpoint
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open_amt/{id}/devices [get]
func (handler *Handler) openAMTDevices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an endpoint with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an endpoint with the specified identifier inside the database", Err: err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	// TODO for testing
	if endpoint.ID == 25 {
		// endpoint.AMTDeviceGUID = "4c4c4544-004b-3910-8037-b6c04f504633"
	}

	device, err := handler.OpenAMTService.DeviceInformation(settings.OpenAMTConfiguration, endpoint.AMTDeviceGUID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve device information", err}
	}

	devicesInformation := Devices{
		Devices: []portainer.OpenAMTDeviceInformation{
			*device,
		},
	}

	return response.JSON(w, devicesInformation)
}
