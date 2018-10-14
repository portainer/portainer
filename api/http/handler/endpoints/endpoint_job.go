package endpoints

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

type endpointJobFromFilePayload struct {
	Image string
	File  []byte
}

type endpointJobFromFileContentPayload struct {
	Image       string
	FileContent string
}

func (payload *endpointJobFromFilePayload) Validate(r *http.Request) error {
	file, _, err := request.RetrieveMultiPartFormFile(r, "File")
	if err != nil {
		return portainer.Error("Invalid Script file. Ensure that the file is uploaded correctly")
	}
	payload.File = file

	image, err := request.RetrieveMultiPartFormValue(r, "Image", false)
	if err != nil {
		return portainer.Error("Invalid image name")
	}
	payload.Image = image

	return nil
}

func (payload *endpointJobFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.FileContent) {
		return portainer.Error("Invalid script file content")
	}

	if govalidator.IsNull(payload.Image) {
		return portainer.Error("Invalid image name")
	}

	return nil
}

// POST request on /api/endpoints/:id/job?method
func (handler *Handler) endpointCommand(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.EndpointAccess(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", portainer.ErrEndpointAccessDenied}
	}

	switch method {
	case "file":
		return handler.executeJobFromFile(w, r, endpoint)
	case "string":
		return handler.executeJobFromFileContent(w, r, endpoint)
	}

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: method. Value must be one of: string or file", errors.New(request.ErrInvalidQueryParameter)}
}

func (handler *Handler) executeJobFromFile(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
	payload := &endpointJobFromFilePayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	err = handler.JobService.Execute(endpoint, payload.Image, payload.File)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed executing job", err}
	}

	return response.Empty(w)
}

func (handler *Handler) executeJobFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
	var payload endpointJobFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	err = handler.JobService.Execute(endpoint, payload.Image, []byte(payload.FileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed executing job", err}
	}

	return response.Empty(w)
}
