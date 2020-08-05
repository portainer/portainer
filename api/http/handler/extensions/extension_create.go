package extensions

import (
	"errors"
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
		return errors.New("Invalid license")
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

	extensions, err := handler.DataStore.Extension().Extensions()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extensions status from the database", err}
	}

	for _, existingExtension := range extensions {
		if existingExtension.ID == extensionID && existingExtension.Enabled {
			return &httperror.HandlerError{http.StatusConflict, "Unable to enable extension", errors.New("This extension is already enabled")}
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

	err = handler.DataStore.Extension().Persist(extension)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist extension status inside the database", err}
	}

	return response.Empty(w)
}
