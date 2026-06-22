package stacks

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

// @id StackStart
// @summary Starts a stopped Stack
// @description Starts a stopped Stack.
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
// @failure 409 "Stack is already active, deploying, or in error state"
// @failure 500 "Server error"
// @router /stacks/{id}/start [post]
func (handler *Handler) stackStart(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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
		return httperror.BadRequest("Starting a kubernetes stack is not supported", err)
	}

	// Check stack status before checking endpoint access to avoid unnecessary database
	// calls in case of invalid stack status
	switch stack.Status {
	case portainer.StackStatusActive:
		return httperror.Conflict("Unable to start stack", errors.New("Stack is already active"))
	case portainer.StackStatusDeploying:
		return httperror.Conflict("Unable to start stack", errors.New("Stack deployment is already in progress"))
	case portainer.StackStatusError:
		errMessage := "Stack is in error state"
		if len(stack.DeploymentStatus) > 0 {
			lastDeploymentStatus := stack.DeploymentStatus[len(stack.DeploymentStatus)-1]
			if lastDeploymentStatus.Status == portainer.StackStatusError && lastDeploymentStatus.Message != "" {
				errMessage = lastDeploymentStatus.Message
			}
		}

		return httperror.Conflict("Unable to start stack", errors.New(errMessage))
	}

	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an endpoint with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an endpoint with the specified identifier inside the database", err)
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return httperror.Forbidden("Permission denied to access endpoint", err)
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "stack management is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	isUnique, err := handler.checkUniqueStackNameInDocker(endpoint, stack.Name, stack.ID, stack.SwarmID != "")
	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	}
	if !isUnique {
		errorMessage := fmt.Sprintf("A stack with the name '%s' is already running", stack.Name)
		return httperror.Conflict(errorMessage, errors.New(errorMessage))
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

	if stack.AutoUpdate != nil && stack.AutoUpdate.Interval != "" {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)

		jobID, e := deployments.StartAutoupdate(context.TODO(), stack.ID, stack.AutoUpdate.Interval, handler.Scheduler, handler.StackDeployer, handler.DataStore, handler.GitService)
		if e != nil {
			return e
		}

		stack.AutoUpdate.JobID = jobID
	}

	if err := handler.startStack(context.TODO(), securityContext.UserID, stack, endpoint, securityContext); err != nil {
		stack.Status = portainer.StackStatusError
		stack.DeploymentStatus = append(stack.DeploymentStatus, portainer.StackDeploymentStatus{
			Status:  portainer.StackStatusError,
			Time:    time.Now().Unix(),
			Message: err.Error(),
		})
		if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return tx.Stack().Update(stack.ID, stack)
		}); err != nil {
			log.Warn().Err(err).Str("context", "StackStart").Msg("Unable to update stack status after failed start attempt")
		}

		return httperror.InternalServerError("Unable to start stack", err)
	}

	stack.Status = portainer.StackStatusActive
	stack.DeploymentStatus = []portainer.StackDeploymentStatus{
		{Status: portainer.StackStatusActive, Time: time.Now().Unix()},
	}
	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.Stack().Update(stack.ID, stack); err != nil {
			return httperror.InternalServerError("Unable to update stack status", err)
		}

		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)

		if err := fillStackGitConfig(tx, userContext, stack); err != nil {
			return httperror.InternalServerError("Unable to load git config for stack", err)
		}
		return nil
	})

	return response.TxResponse(w, stack, err)
}

func (handler *Handler) startStack(
	ctx context.Context,
	userID portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	securityContext *security.RestrictedRequestContext,
) error {
	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return fmt.Errorf("unable to load user information from the database: %w", err)
	}

	registries, err := handler.DataStore.Registry().ReadAll()
	if err != nil {
		return fmt.Errorf("unable to retrieve registries from the database: %w", err)
	}

	filteredRegistries := security.FilterRegistries(registries, user, securityContext.UserMemberships, endpoint.ID)

	switch stack.Type {
	case portainer.DockerComposeStack:
		stack.Name = handler.ComposeStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			return handler.StackDeployer.StartRemoteComposeStack(ctx, userID, stack, endpoint, filteredRegistries)
		}

		return handler.StackDeployer.DeployComposeStack(ctx, stack, endpoint, filteredRegistries, false, false, false)
	case portainer.DockerSwarmStack:
		stack.Name = handler.SwarmStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			return handler.StackDeployer.StartRemoteSwarmStack(ctx, userID, stack, endpoint, filteredRegistries)
		}

		return handler.StackDeployer.DeploySwarmStack(ctx, stack, endpoint, filteredRegistries, true, true)
	}

	return nil
}
