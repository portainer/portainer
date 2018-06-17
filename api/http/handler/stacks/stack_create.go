package stacks

import (
	"net/http"
	"strconv"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
)

func (handler *Handler) cleanUp(stack *portainer.Stack, doCleanUp *bool) error {
	if !*doCleanUp {
		return nil
	}

	handler.FileService.RemoveDirectory(stack.ProjectPath)
	return nil
}

func buildStackIdentifier(stackName string, endpointID portainer.EndpointID) string {
	return stackName + "_" + strconv.Itoa(int(endpointID))
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
	if err == portainer.ErrEndpointNotFound {
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

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: type. Value must be one of: 1 (Swarm stack) or 2 (Compose stack)", request.ErrInvalidQueryParameter}
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

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: method. Value must be one of: string, repository or file", request.ErrInvalidQueryParameter}
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

	return &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: method. Value must be one of: string, repository or file", request.ErrInvalidQueryParameter}
}
