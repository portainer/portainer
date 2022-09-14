package stacks

import (
	"net/http"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/stackutils"
)

// @id StackInspect
// @summary Inspect a stack
// @description Retrieve details about a stack.
// @description **Access policy**: restricted
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Stack identifier"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Stack not found"
// @failure 500 "Server error"
// @router /stacks/{id} [get]
func (handler *Handler) stackInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	stack, err := handler.DataStore.Stack().Stack(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		if !securityContext.IsAdmin {
			return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
		}
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "Stack management is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	if endpoint != nil {
		err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
		if err != nil {
			return httperror.Forbidden("Permission denied to access environment", err)
		}

		if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
			resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
			if err != nil {
				return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
			}

			access, err := handler.userCanAccessStack(securityContext, endpoint.ID, resourceControl)
			if err != nil {
				return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
			}
			if !access {
				return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
			}

			if resourceControl != nil {
				stack.ResourceControl = resourceControl
			}
		}
	}

	if stack.GitConfig != nil && stack.GitConfig.Authentication != nil && stack.GitConfig.Authentication.Password != "" {
		// sanitize password in the http response to minimise possible security leaks
		stack.GitConfig.Authentication.Password = ""
	}

	return response.JSON(w, stack)
}
