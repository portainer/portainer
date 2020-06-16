package stacks

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

// DELETE request on /api/stacks/:id?external=<external>&endpointId=<endpointId>
// If the external query parameter is set to true, the id route variable is expected to be
// the name of an external stack as a string.
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

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint, true)
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
		return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", portainer.ErrResourceAccessDenied}
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

	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to load user information from the database", err}
	}

	rbacExtension, err := handler.DataStore.Extension().Extension(portainer.RBACExtension)
	if err != nil && err != bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to verify if RBAC extension is loaded", err}
	}

	endpointResourceAccess := false
	_, ok := user.EndpointAuthorizations[portainer.EndpointID(endpointID)][portainer.EndpointResourcesAccess]
	if ok {
		endpointResourceAccess = true
	}

	if rbacExtension != nil {
		if !securityContext.IsAdmin && !endpointResourceAccess {
			return &httperror.HandlerError{http.StatusUnauthorized, "Permission denied to delete the stack", errors.ErrUnauthorized}
		}
	} else {
		if !securityContext.IsAdmin {
			return &httperror.HandlerError{http.StatusUnauthorized, "Permission denied to delete the stack", errors.ErrUnauthorized}
		}
	}

	stack, err := handler.DataStore.Stack().StackByName(stackName)
	if err != nil && err != bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to check for stack existence inside the database", err}
	}
	if stack != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "A stack with this name exists inside the database. Cannot use external delete method", portainer.ErrStackNotExternal}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find the endpoint associated to the stack inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find the endpoint associated to the stack inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint, true)
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
