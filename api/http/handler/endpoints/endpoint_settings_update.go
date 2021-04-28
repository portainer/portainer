package endpoints

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/useractivity"
)

type endpointSettingsUpdatePayload struct {
	// Whether non-administrator should be able to use bind mounts when creating containers
	AllowBindMountsForRegularUsers *bool `json:"allowBindMountsForRegularUsers" example:"false"`
	// Whether non-administrator should be able to use privileged mode when creating containers
	AllowPrivilegedModeForRegularUsers *bool `json:"allowPrivilegedModeForRegularUsers" example:"false"`
	// Whether non-administrator should be able to browse volumes
	AllowVolumeBrowserForRegularUsers *bool `json:"allowVolumeBrowserForRegularUsers" example:"true"`
	// Whether non-administrator should be able to use the host pid
	AllowHostNamespaceForRegularUsers *bool `json:"allowHostNamespaceForRegularUsers" example:"true"`
	// Whether non-administrator should be able to use device mapping
	AllowDeviceMappingForRegularUsers *bool `json:"allowDeviceMappingForRegularUsers" example:"true"`
	// Whether non-administrator should be able to manage stacks
	AllowStackManagementForRegularUsers *bool `json:"allowStackManagementForRegularUsers" example:"true"`
	// Whether non-administrator should be able to use container capabilities
	AllowContainerCapabilitiesForRegularUsers *bool `json:"allowContainerCapabilitiesForRegularUsers" example:"true"`
	// Whether non-administrator should be able to use sysctl settings
	AllowSysctlSettingForRegularUsers *bool `json:"allowSysctlSettingForRegularUsers" example:"true"`
	// Whether host management features are enabled
	EnableHostManagementFeatures *bool `json:"enableHostManagementFeatures" example:"true"`
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

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint, true)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
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

	updateAuthorizations := false
	if payload.AllowVolumeBrowserForRegularUsers != nil {
		updateAuthorizations = securitySettings.AllowVolumeBrowserForRegularUsers != *payload.AllowVolumeBrowserForRegularUsers
		securitySettings.AllowVolumeBrowserForRegularUsers = *payload.AllowVolumeBrowserForRegularUsers
	}

	if payload.AllowSysctlSettingForRegularUsers != nil {
		securitySettings.AllowSysctlSettingForRegularUsers = *payload.AllowSysctlSettingForRegularUsers
	}

	if payload.EnableHostManagementFeatures != nil {
		securitySettings.EnableHostManagementFeatures = *payload.EnableHostManagementFeatures
	}

	endpoint.SecuritySettings = securitySettings

	err = handler.DataStore.Endpoint().UpdateEndpoint(portainer.EndpointID(endpointID), endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed persisting endpoint in database", err}
	}

	useractivity.LogHttpActivity(handler.UserActivityStore, endpoint.Name, r, payload)

	if updateAuthorizations {
		err := handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update RBAC authorizations", err}
		}
	}

	return response.JSON(w, endpoint)
}
