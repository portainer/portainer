package openamt

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"
)

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

	if endpoint.AMTDeviceGUID == "" {
		return response.JSON(w, []portainer.OpenAMTDeviceInformation{})
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	device, err := handler.OpenAMTService.DeviceInformation(settings.OpenAMTConfiguration, endpoint.AMTDeviceGUID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve device information", err}
	}

	devices := []portainer.OpenAMTDeviceInformation{
		*device,
	}

	return response.JSON(w, devices)
}

type deviceActionPayload struct {
	Action string
}

func (payload *deviceActionPayload) Validate(r *http.Request) error {
	if payload.Action == "" {
		return errors.New("device action must be provided")
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
// @router /open_amt/{id}/devices/{deviceId}/action [post]
func (handler *Handler) deviceAction(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	deviceID, err := request.RetrieveRouteVariableValue(r, "deviceId")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid device identifier route variable", err}
	}

	var payload deviceActionPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		logrus.WithError(err).Error("Invalid request payload")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	err = handler.OpenAMTService.ExecuteDeviceAction(settings.OpenAMTConfiguration, deviceID, payload.Action)
	if err != nil {
		logrus.WithError(err).Error("Error executing device action")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Error executing device action", Err: err}
	}

	return response.Empty(w)
}

type deviceFeaturesPayload struct {
	Features portainer.OpenAMTDeviceEnabledFeatures
}

func (payload *deviceFeaturesPayload) Validate(r *http.Request) error {
	if payload.Features.UserConsent == "" {
		return errors.New("device user consent status must be provided")
	}
	return nil
}

type AuthorizationResponse struct {
	Server string
	Token  string
}

// @id DeviceFeatures
// @summary Enable features on an AMT managed device
// @description Enable features on an AMT managed device
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @accept json
// @produce json
// @param body body deviceFeaturesPayload true "Device Features"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open_amt/{id}/devices_features/{deviceId} [post]
func (handler *Handler) deviceFeatures(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	deviceID, err := request.RetrieveRouteVariableValue(r, "deviceId")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid device identifier route variable", err}
	}

	var payload deviceFeaturesPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		logrus.WithError(err).Error("Invalid request payload")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	_, err = handler.OpenAMTService.DeviceInformation(settings.OpenAMTConfiguration, deviceID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve device information", err}
	}

	token, err := handler.OpenAMTService.EnableDeviceFeatures(settings.OpenAMTConfiguration, deviceID, payload.Features)
	if err != nil {
		logrus.WithError(err).Error("Error executing device action")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Error executing device action", Err: err}
	}

	authorizationResponse := AuthorizationResponse{
		Server: settings.OpenAMTConfiguration.MPSServer,
		Token:  token,
	}
	return response.JSON(w, authorizationResponse)
}
