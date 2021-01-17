package stacks

import (
	"errors"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// @summary Delete a Stack
// @description If the external query parameter is set to true, the id route variable is expected to be
// @description the name of an external stack as a string.
// @tags stacks
// @security ApiKeyAuth
// @accept json
// @produce json
// @param id path string true "Stack Id"
// @param external query boolean false "Provide if stack is external"
// @param endpointId query int false "Endpoint Id"
// @success 204
// @failure 400,401,403,404,500
// @router /stacks/{id} [delete]
func (handler *Handler) stackDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	externalStack, _ := request.RetrieveBooleanQueryParameter(r, "external", true)
	if externalStack {
		return handler.deleteExternalStack(r, w, stackID, securityContext)
	}

	id, err := strconv.Atoi(stackID)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	stack, err := handler.DataStore.Stack().Stack(portainer.StackID(id))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a stack with the specified identifier inside the database", err}
	}

	// TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
	// The EndpointID property is not available for these stacks, this API endpoint
	// can use the optional EndpointID query parameter to set a valid endpoint identifier to be
	// used in the context of this request.
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
	}
	endpointIdentifier := stack.EndpointID
	if endpointID != 0 {
		endpointIdentifier = portainer.EndpointID(endpointID)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(endpointIdentifier)
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find the endpoint associated to the stack inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find the endpoint associated to the stack inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stack.Name, portainer.StackResourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a resource control associated to the stack", err}
	}

	access, err := handler.userCanAccessStack(securityContext, endpoint.ID, resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to verify user authorizations to validate stack access", err}
	}
	if !access {
		return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", httperrors.ErrResourceAccessDenied}
	}

	err = handler.deleteStack(stack, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	err = handler.DataStore.Stack().DeleteStack(portainer.StackID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the stack from the database", err}
	}

	if resourceControl != nil {
		err = handler.DataStore.ResourceControl().DeleteResourceControl(resourceControl.ID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the associated resource control from the database", err}
		}
	}

	err = handler.FileService.RemoveDirectory(stack.ProjectPath)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove stack files from disk", err}
	}

	return response.Empty(w)
}

func (handler *Handler) deleteExternalStack(r *http.Request, w http.ResponseWriter, stackName string, securityContext *security.RestrictedRequestContext) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
	}

	if !securityContext.IsAdmin {
		return &httperror.HandlerError{http.StatusUnauthorized, "Permission denied to delete the stack", httperrors.ErrUnauthorized}
	}

	stack, err := handler.DataStore.Stack().StackByName(stackName)
	if err != nil && err != bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to check for stack existence inside the database", err}
	}
	if stack != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "A stack with this name exists inside the database. Cannot use external delete method", errors.New("A tag already exists with this name")}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find the endpoint associated to the stack inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find the endpoint associated to the stack inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	stack = &portainer.Stack{
		Name: stackName,
		Type: portainer.DockerSwarmStack,
	}

	err = handler.deleteStack(stack, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete stack", err}
	}

	return response.Empty(w)
}

func (handler *Handler) deleteStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	if stack.Type == portainer.DockerSwarmStack {
		return handler.SwarmStackManager.Remove(stack, endpoint)
	}

	return handler.ComposeStackManager.Down(stack, endpoint)
}
