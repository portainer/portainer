package stacks

import (
	"net/http"
	"path"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

type stackFileResponse struct {
	StackFileContent string `json:"StackFileContent"`
}

// GET request on /api/stacks/:id/file
func (handler *Handler) stackFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	stack, err := handler.StackService.Stack(portainer.StackID(stackID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a stack with the specified identifier inside the database", err}
	}

	resourceControl, err := handler.ResourceControlService.ResourceControlByResourceID(stack.Name)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a resource control associated to the stack", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	extendedStack := proxy.ExtendedStack{*stack, portainer.ResourceControl{}}
	if resourceControl != nil {
		if securityContext.IsAdmin || proxy.CanAccessStack(stack, resourceControl, securityContext.UserID, securityContext.UserMemberships) {
			extendedStack.ResourceControl = *resourceControl
		} else {
			return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", portainer.ErrResourceAccessDenied}
		}
	}

	stackFileContent, err := handler.FileService.GetFileContent(path.Join(stack.ProjectPath, stack.EntryPoint))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Compose file from disk", err}
	}

	return response.JSON(w, &stackFileResponse{StackFileContent: string(stackFileContent)})
}
