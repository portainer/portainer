package endpoints

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
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

// POST request on /api/endpoints/:id/job?method&nodeName
func (handler *Handler) endpointJob(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method", err}
	}

	nodeName, _ := request.RetrieveQueryParameter(r, "nodeName", true)

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	switch method {
	case "file":
		return handler.executeJobFromFile(w, r, endpoint, nodeName)
	case "string":
		return handler.executeJobFromFileContent(w, r, endpoint, nodeName)
	}

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: method. Value must be one of: string or file", errors.New(request.ErrInvalidQueryParameter)}
}

func (handler *Handler) executeJobFromFile(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, nodeName string) *httperror.HandlerError {
	payload := &endpointJobFromFilePayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	err = handler.JobService.ExecuteScript(endpoint, nodeName, payload.Image, payload.File, nil)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed executing job", err}
	}

	return response.Empty(w)
}

func (handler *Handler) executeJobFromFileContent(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint, nodeName string) *httperror.HandlerError {
	var payload endpointJobFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	err = handler.JobService.ExecuteScript(endpoint, nodeName, payload.Image, []byte(payload.FileContent), nil)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed executing job", err}
	}

	return response.Empty(w)
}
