package extensions

import (
	"net/http"
	"strconv"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type extensionCreatePayload struct {
	License string
}

func (payload *extensionCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.License) {
		return portainer.Error("Invalid license")
	}

	return nil
}

func (handler *Handler) extensionCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload extensionCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	extensionIdentifier, err := strconv.Atoi(string(payload.License[0]))
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid license format", err}
	}
	extensionID := portainer.ExtensionID(extensionIdentifier)

	extensions, err := handler.ExtensionService.Extensions()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions status from the database", err}
	}

	for _, existingExtension := range extensions {
		if existingExtension.ID == extensionID && existingExtension.Enabled {
			return &httperror.HandlerError{http.StatusConflict, "Unable to enable extension", portainer.ErrExtensionAlreadyEnabled}
		}
	}

	extension := &portainer.Extension{
		ID: extensionID,
	}

	extensionDefinitions, err := handler.ExtensionManager.FetchExtensionDefinitions()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extension definitions", err}
	}

	for _, def := range extensionDefinitions {
		if def.ID == extension.ID {
			extension.Version = def.Version
			break
		}
	}

	err = handler.ExtensionManager.EnableExtension(extension, payload.License)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to enable extension", err}
	}

	extension.Enabled = true

	// TODO: refactor/cleanup
	if extension.ID == portainer.RBACExtension {
		endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from the database", err}
		}

		for _, endpointGroup := range endpointGroups {
			for key := range endpointGroup.UserAccessPolicies {
				tmp := endpointGroup.UserAccessPolicies[key]
				tmp.RoleID = 4
				endpointGroup.UserAccessPolicies[key] = tmp
			}

			for key := range endpointGroup.TeamAccessPolicies {
				tmp := endpointGroup.TeamAccessPolicies[key]
				tmp.RoleID = 4
				endpointGroup.TeamAccessPolicies[key] = tmp
			}

			err := handler.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, &endpointGroup)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint group access policies", err}
			}

		}

		endpoints, err := handler.EndpointService.Endpoints()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
		}

		for _, endpoint := range endpoints {
			for key := range endpoint.UserAccessPolicies {
				tmp := endpoint.UserAccessPolicies[key]
				tmp.RoleID = 4
				endpoint.UserAccessPolicies[key] = tmp
			}

			for key := range endpoint.TeamAccessPolicies {
				tmp := endpoint.TeamAccessPolicies[key]
				tmp.RoleID = 4
				endpoint.TeamAccessPolicies[key] = tmp
			}

			err := handler.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint access policies", err}
			}
		}
	}

	err = handler.ExtensionService.Persist(extension)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist extension status inside the database", err}
	}

	return response.Empty(w)
}
