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
func (handler *StackHandler) stackFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{err, "Invalid stack identifier route variable", http.StatusBadRequest}
	}

	stack, err := handler.StackService.Stack(portainer.StackID(stackID))
	if err == portainer.ErrStackNotFound {
		return &httperror.HandlerError{err, "Unable to find a stack with the specified identifier inside the database", http.StatusNotFound}
	} else if err != nil {
		return &httperror.HandlerError{err, "Unable to find a stack with the specified identifier inside the database", http.StatusInternalServerError}
	}

	resourceControl, err := handler.ResourceControlService.ResourceControlByResourceID(stack.Name)
	if err != nil && err != portainer.ErrResourceControlNotFound {
		return &httperror.HandlerError{err, "Unable to retrieve a resource control associated to the stack", http.StatusInternalServerError}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{err, "Unable to retrieve info from request context", http.StatusInternalServerError}
	}

	extendedStack := proxy.ExtendedStack{*stack, portainer.ResourceControl{}}
	if resourceControl != nil {
		if securityContext.IsAdmin || proxy.CanAccessStack(stack, resourceControl, securityContext.UserID, securityContext.UserMemberships) {
			extendedStack.ResourceControl = *resourceControl
		} else {
			return &httperror.HandlerError{portainer.ErrResourceAccessDenied, "Access denied to resource", http.StatusForbidden}
		}
	}

	stackFileContent, err := handler.FileService.GetFileContent(path.Join(stack.ProjectPath, stack.EntryPoint))
	if err != nil {
		return &httperror.HandlerError{err, "Unable to retrieve Compose file from disk", http.StatusInternalServerError}
	}

	return response.WriteJSONResponse(w, &stackFileResponse{StackFileContent: stackFileContent})
}
