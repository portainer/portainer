package extensions

import (
	"errors"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type extensionUploadPayload struct {
	License          string
	ExtensionArchive []byte
	ArchiveFileName  string
}

func (payload *extensionUploadPayload) Validate(r *http.Request) error {
	license, err := request.RetrieveMultiPartFormValue(r, "License", false)
	if err != nil {
		return errors.New("Invalid license")
	}
	payload.License = license

	fileData, fileName, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return errors.New("Invalid extension archive file. Ensure that the file is uploaded correctly")
	}
	payload.ExtensionArchive = fileData
	payload.ArchiveFileName = fileName

	return nil
}

func (handler *Handler) extensionUpload(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &extensionUploadPayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	extensionIdentifier, err := strconv.Atoi(string(payload.License[0]))
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid license format", err}
	}
	extensionID := portainer.ExtensionID(extensionIdentifier)

	extension := &portainer.Extension{
		ID: extensionID,
	}

	_ = handler.ExtensionManager.DisableExtension(extension)

	err = handler.ExtensionManager.InstallExtension(extension, payload.License, payload.ArchiveFileName, payload.ExtensionArchive)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to install extension", err}
	}

	extension.Enabled = true

	err = handler.DataStore.Extension().Persist(extension)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist extension status inside the database", err}
	}

	return response.Empty(w)
}
