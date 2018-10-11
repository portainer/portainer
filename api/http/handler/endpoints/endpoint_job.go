package endpoints

import (
	"errors"
	"net/http"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

type endpointJobPayload struct {
	Image string
}

type endpointJobFromFilePayload struct {
	endpointJobPayload
	File []byte
}

type endpointJobFromFileContentPayload struct {
	endpointJobPayload
	FileContent string
}

func (payload endpointJobPayload) Validate(r *http.Request) error {
	image, _ := request.RetrieveMultiPartFormValue(r, "Image", true)

	if strings.TrimSpace(image) != "" {
		payload.Image = image
	} else {
		payload.Image = "ubuntu:latest"
	}

	return nil
}

func (payload *endpointJobFromFilePayload) Validate(r *http.Request) error {
	file, _, err := request.RetrieveMultiPartFormFile(r, "File")
	if err != nil {
		return portainer.Error("Invalid Script file. Ensure that the file is uploaded correctly")
	}
	payload.File = file

	// TODO why doesn't it work? why image is empty?
	return payload.endpointJobPayload.Validate(r)
}

func (payload *endpointJobFromFileContentPayload) Validate(r *http.Request) error {
	fileContent, err := request.RetrieveMultiPartFormValue(r, "FileContent", false)
	if err != nil {
		return portainer.Error("Invalid script file content")
	}
	payload.FileContent = fileContent

	image, _ := request.RetrieveMultiPartFormValue(r, "Image", true)

	if strings.TrimSpace(image) != "" {
		payload.Image = image
	} else {
		payload.Image = "ubuntu:latest"
	}

	return nil
	// return payload.endpointJobPayload.Validate(r)
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
	payload := &endpointJobFromFileContentPayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid request payload",
			Err:        err,
		}
	}

	err = handler.JobService.Execute(endpoint, payload.Image, []byte(payload.FileContent))
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Failed executing job",
			Err:        err,
		}
	}

	return response.Empty(w)
}
