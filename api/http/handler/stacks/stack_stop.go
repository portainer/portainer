package stacks

import (
	"context"
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id StackStop
// @summary Stop a running Stack
// @description Stop a running Stack.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Stack identifier"
// @param endpointId query int true "Environment identifier"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 409 "Conflict"
// @failure 500 "Server error"
// @router /stacks/{id}/stop [post]
func (handler *Handler) stackStop(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	stack, err := handler.DataStore.Stack().Read(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	if stack.Type == portainer.KubernetesStack {
		return httperror.BadRequest("Stopping a kubernetes stack is not supported", err)
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
	}

	access, err := handler.userCanAccessStack(securityContext, resourceControl)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
	}
	if !access {
		return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "stack management is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	if stack.Status == portainer.StackStatusInactive {
		return httperror.BadRequest("Stack is already inactive", errors.New("Stack is already inactive"))
	}

	if stack.Status == portainer.StackStatusDeploying {
		return httperror.Conflict("Stack deployment is in progress", errors.New("stack deployment is in progress"))
	}

	// stop scheduler updates of the stack before stopping
	if stack.AutoUpdate != nil && stack.AutoUpdate.JobID != "" {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
		stack.AutoUpdate.JobID = ""
	}

	stopErr := handler.stopStack(r.Context(), stack, endpoint)
	if stopErr != nil {
		if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			stackutils.UpdateStackStatusFromUndeploymentResult(stack, stopErr)
			return tx.Stack().Update(stack.ID, stack)
		}); err != nil {
			log.Warn().Err(err).Str("context", "StackStop").Msg("Unable to update stack status after failed stop attempt")
		}

		return httperror.InternalServerError("Unable to stop stack", stopErr)
	}

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stackutils.UpdateStackStatusFromUndeploymentResult(stack, nil)
		return tx.Stack().Update(stack.ID, stack)
	}); err != nil {
		return httperror.InternalServerError("Unable to update stack status", err)
	}

	if err := fillStackGitConfig(handler.DataStore, stack); err != nil {
		return httperror.InternalServerError("Unable to load git config for stack", err)
	}

	return response.JSON(w, stack)
}

func (handler *Handler) stopStack(ctx context.Context, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	switch stack.Type {
	case portainer.DockerComposeStack:
		stack.Name = handler.ComposeStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			return handler.StackDeployer.StopRemoteComposeStack(ctx, stack, endpoint)
		}

		return handler.StackDeployer.UndeployComposeStack(ctx, stack, endpoint)
	case portainer.DockerSwarmStack:
		stack.Name = handler.SwarmStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			return handler.StackDeployer.StopRemoteSwarmStack(ctx, stack, endpoint)
		}

		return handler.SwarmStackManager.Remove(ctx, stack, endpoint)
	}

	return nil
}
