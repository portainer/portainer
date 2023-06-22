package stacks

import (
	"fmt"
	"net/http"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

// @id StackAssociate
// @summary Associate an orphaned stack to a new environment(endpoint)
// @description **Access policy**: administrator
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Stack identifier"
// @param endpointId query int true "Environment identifier"
// @param swarmId query int true "Swarm identifier"
// @param orphanedRunning query boolean true "Indicates whether the stack is orphaned"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Stack not found"
// @failure 500 "Server error"
// @router /stacks/{id}/associate [put]
func (handler *Handler) stackAssociate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	swarmId, err := request.RetrieveQueryParameter(r, "swarmId", true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: swarmId", err)
	}

	orphanedRunning, err := request.RetrieveBooleanQueryParameter(r, "orphanedRunning", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: orphanedRunning", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return httperror.InternalServerError("Unable to load user information from the database", err)
	}

	stack, err := handler.DataStore.Stack().Read(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
	}

	if resourceControl != nil {
		resourceControl.ResourceID = fmt.Sprintf("%d_%s", endpointID, stack.Name)

		err = handler.DataStore.ResourceControl().Update(resourceControl.ID, resourceControl)
		if err != nil {
			return httperror.InternalServerError("Unable to persist resource control changes inside the database", err)
		}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "Stack management is disabled for non-admin users"
		return httperror.Forbidden(errMsg, fmt.Errorf(errMsg))
	}

	stack.EndpointID = portainer.EndpointID(endpointID)
	stack.SwarmID = swarmId

	if orphanedRunning {
		stack.Status = portainer.StackStatusActive
	} else {
		stack.Status = portainer.StackStatusInactive
	}

	stack.CreationDate = time.Now().Unix()
	stack.CreatedBy = user.Username
	stack.UpdateDate = 0
	stack.UpdatedBy = ""

	err = handler.DataStore.Stack().Update(stack.ID, stack)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the stack changes inside the database", err)
	}

	stack.ResourceControl = resourceControl

	if stack.GitConfig != nil && stack.GitConfig.Authentication != nil && stack.GitConfig.Authentication.Password != "" {
		// sanitize password in the http response to minimise possible security leaks
		stack.GitConfig.Authentication.Password = ""
	}

	return response.JSON(w, stack)
}
