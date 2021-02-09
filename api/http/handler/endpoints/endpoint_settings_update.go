package endpoints

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

type endpointSettingsUpdatePayload struct {
	AllowBindMountsForRegularUsers            *bool `json:"allowBindMountsForRegularUsers"`
	AllowPrivilegedModeForRegularUsers        *bool `json:"allowPrivilegedModeForRegularUsers"`
	AllowVolumeBrowserForRegularUsers         *bool `json:"allowVolumeBrowserForRegularUsers"`
	AllowHostNamespaceForRegularUsers         *bool `json:"allowHostNamespaceForRegularUsers"`
	AllowDeviceMappingForRegularUsers         *bool `json:"allowDeviceMappingForRegularUsers"`
	AllowStackManagementForRegularUsers       *bool `json:"allowStackManagementForRegularUsers"`
	AllowContainerCapabilitiesForRegularUsers *bool `json:"allowContainerCapabilitiesForRegularUsers"`
	EnableHostManagementFeatures              *bool `json:"enableHostManagementFeatures"`
}

func (payload *endpointSettingsUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/endpoints/:id/settings
func (handler *Handler) endpointSettingsUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	var payload endpointSettingsUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	securitySettings := endpoint.SecuritySettings

	if payload.AllowBindMountsForRegularUsers != nil {
		securitySettings.AllowBindMountsForRegularUsers = *payload.AllowBindMountsForRegularUsers
	}

	if payload.AllowContainerCapabilitiesForRegularUsers != nil {
		securitySettings.AllowContainerCapabilitiesForRegularUsers = *payload.AllowContainerCapabilitiesForRegularUsers
	}

	if payload.AllowDeviceMappingForRegularUsers != nil {
		securitySettings.AllowDeviceMappingForRegularUsers = *payload.AllowDeviceMappingForRegularUsers
	}

	if payload.AllowHostNamespaceForRegularUsers != nil {
		securitySettings.AllowHostNamespaceForRegularUsers = *payload.AllowHostNamespaceForRegularUsers
	}

	if payload.AllowPrivilegedModeForRegularUsers != nil {
		securitySettings.AllowPrivilegedModeForRegularUsers = *payload.AllowPrivilegedModeForRegularUsers
	}

	if payload.AllowStackManagementForRegularUsers != nil {
		securitySettings.AllowStackManagementForRegularUsers = *payload.AllowStackManagementForRegularUsers
	}

	if payload.AllowVolumeBrowserForRegularUsers != nil {
		securitySettings.AllowVolumeBrowserForRegularUsers = *payload.AllowVolumeBrowserForRegularUsers
	}

	if payload.EnableHostManagementFeatures != nil {
		securitySettings.EnableHostManagementFeatures = *payload.EnableHostManagementFeatures
	}

	endpoint.SecuritySettings = securitySettings

	err = handler.DataStore.Endpoint().UpdateEndpoint(portainer.EndpointID(endpointID), endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed persisting endpoint in database", err}
	}

	return response.JSON(w, endpoint)
}
