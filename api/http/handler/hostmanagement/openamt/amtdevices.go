package openamt

import (
	"errors"
	"github.com/sirupsen/logrus"
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

	// TODO delete after INT-7 is implemented, currently used for OpenAMT testing
	endpoint.AMTDeviceGUID = "4c4c4544-004b-3910-8037-b6c04f504633"

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

type deviceActionPayload struct {
	DeviceID     string
	DeviceAction string
}

func (payload *deviceActionPayload) Validate(r *http.Request) error {
	if payload.DeviceAction == "" {
		return errors.New("device action must be provided")
	}
	if payload.DeviceID == "" {
		return errors.New("device GUID must be provided")
	}
	return nil
}

// @id DeviceAction
// @summary Execute out of band action on an AMT managed device
// @description Execute out of band action on an AMT managed device
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @accept json
// @produce json
// @param body body deviceActionPayload true "Device Action"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open_amt/{id}/devices/{deviceId}/{deviceAction} [post]
func (handler *Handler) deviceAction(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload deviceActionPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		logrus.WithError(err).Error("Invalid request payload")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	err = handler.OpenAMTService.ExecuteDeviceAction(settings.OpenAMTConfiguration, payload.DeviceID, payload.DeviceAction)
	if err != nil {
		logrus.WithError(err).Error("Error executing device action")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Error executing device action", Err: err}
	}

	return response.Empty(w)
}