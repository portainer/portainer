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

func buildStackIdentifier(stackName string, endpointID int) string {
	return stackName + "_" + strconv.Itoa(endpointID)
}

// POST request on /api/stacks?type=<type>&method=<method>
func (handler *Handler) stackCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackType, err := request.RetrieveNumericQueryParameter(r, "type", false)
	if err != nil {
		return &httperror.HandlerError{err, "Invalid query parameter: type", http.StatusBadRequest}
	}

	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{err, "Invalid query parameter: method", http.StatusBadRequest}
	}

	switch portainer.StackType(stackType) {
	case portainer.DockerSwarmStack:
		return handler.createSwarmStack(w, r, method)
	case portainer.DockerComposeStack:
		return handler.createComposeStack(w, r, method)
	}

	return &httperror.HandlerError{httperror.ErrInvalidRequestFormat, "Invalid value for query parameter: type. Value must be one of: 1 (Swarm stack) or 2 (Compose stack)", http.StatusBadRequest}
}

func (handler *Handler) createComposeStack(w http.ResponseWriter, r *http.Request, method string) *httperror.HandlerError {

	switch method {
	case "string":
		return handler.createComposeStackFromFileContent(w, r)
	case "repository":
		return handler.createComposeStackFromGitRepository(w, r)
	case "file":
		return handler.createComposeStackFromFileUpload(w, r)
	}

	return &httperror.HandlerError{httperror.ErrInvalidQueryParameter, "Invalid value for query parameter: method. Value must be one of: string, repository or file", http.StatusBadRequest}
}

func (handler *Handler) createSwarmStack(w http.ResponseWriter, r *http.Request, method string) *httperror.HandlerError {
	switch method {
	case "string":
		return handler.createSwarmStackFromFileContent(w, r)
	case "repository":
		return handler.createSwarmStackFromGitRepository(w, r)
	case "file":
		return handler.createSwarmStackFromFileUpload(w, r)
	}

	return &httperror.HandlerError{httperror.ErrInvalidQueryParameter, "Invalid value for query parameter: method. Value must be one of: string, repository or file", http.StatusBadRequest}
}
