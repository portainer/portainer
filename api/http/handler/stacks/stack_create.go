package stacks

import (
	"errors"
	"log"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer"
)

func (handler *Handler) cleanUp(stack *portainer.Stack, doCleanUp *bool) error {
	if !*doCleanUp {
		return nil
	}

	err := handler.FileService.RemoveDirectory(stack.ProjectPath)
	if err != nil {
		log.Printf("http error: Unable to cleanup stack creation (err=%s)\n", err)
	}
	return nil
}

// POST request on /api/stacks?type=<type>&method=<method>&endpointId=<endpointId>
func (handler *Handler) stackCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackType, err := request.RetrieveNumericQueryParameter(r, "type", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: type", err}
	}

	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method", err}
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
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

	switch portainer.StackType(stackType) {
	case portainer.DockerSwarmStack:
		return handler.createSwarmStack(w, r, method, endpoint)
	case portainer.DockerComposeStack:
		return handler.createComposeStack(w, r, method, endpoint)
	}

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: type. Value must be one of: 1 (Swarm stack) or 2 (Compose stack)", errors.New(request.ErrInvalidQueryParameter)}
}

func (handler *Handler) createComposeStack(w http.ResponseWriter, r *http.Request, method string, endpoint *portainer.Endpoint) *httperror.HandlerError {

	switch method {
	case "string":
		return handler.createComposeStackFromFileContent(w, r, endpoint)
	case "repository":
		return handler.createComposeStackFromGitRepository(w, r, endpoint)
	case "file":
		return handler.createComposeStackFromFileUpload(w, r, endpoint)
	}

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: method. Value must be one of: string, repository or file", errors.New(request.ErrInvalidQueryParameter)}
}

func (handler *Handler) createSwarmStack(w http.ResponseWriter, r *http.Request, method string, endpoint *portainer.Endpoint) *httperror.HandlerError {
	switch method {
	case "string":
		return handler.createSwarmStackFromFileContent(w, r, endpoint)
	case "repository":
		return handler.createSwarmStackFromGitRepository(w, r, endpoint)
	case "file":
		return handler.createSwarmStackFromFileUpload(w, r, endpoint)
	}

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: method. Value must be one of: string, repository or file", errors.New(request.ErrInvalidQueryParameter)}
}
