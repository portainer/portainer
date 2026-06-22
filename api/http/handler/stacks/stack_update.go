package stacks

import (
	"context"
	"net/http"
	"strconv"
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

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type postDeployFunc func(ctx context.Context, err error)

type updateComposeStackPayload struct {
	// New content of the Stack file
	StackFileContent string `example:"version: 3\n services:\n web:\n image:nginx"`
	// A list of environment(endpoint) variables used during stack deployment
	Env []portainer.Pair
	// RepullImageAndRedeploy indicates whether to force repulling images and redeploying the stack
	RepullImageAndRedeploy bool
	// Prune services that are no longer referenced
	Prune bool `example:"true"`

	// Deprecated(2.36): use RepullImageAndRedeploy instead for cleaner responsibility
	// Force a pulling to current image with the original tag though the image is already the latest
	PullImage bool `example:"false"`
}

func (payload *updateComposeStackPayload) Validate(r *http.Request) error {
	if len(payload.StackFileContent) == 0 {
		return errors.New("Invalid stack file content")
	}

	return nil
}

type updateSwarmStackPayload struct {
	// New content of the Stack file
	StackFileContent string `example:"version: 3\n services:\n web:\n image:nginx"`
	// A list of environment(endpoint) variables used during stack deployment
	Env []portainer.Pair
	// Prune services that are no longer referenced
	Prune bool `example:"true"`
	// RepullImageAndRedeploy indicates whether to force repulling images and redeploying the stack
	RepullImageAndRedeploy bool

	// Deprecated(2.36): use RepullImageAndRedeploy instead for cleaner responsibility
	// Force a pulling to current image with the original tag though the image is already the latest
	PullImage bool `example:"false"`
}

func (payload *updateSwarmStackPayload) Validate(r *http.Request) error {
	if len(payload.StackFileContent) == 0 {
		return errors.New("Invalid stack file content")
	}

	return nil
}

// @id StackUpdate
// @summary Update a stack
// @description Update a stack, only for file based stacks.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Stack identifier"
// @param endpointId query int true "Environment identifier"
// @param body body updateSwarmStackPayload true "Stack details"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Not found"
// @failure 409 "Conflict"
// @failure 500 "Server error"
// @router /stacks/{id} [put]
func (handler *Handler) stackUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	// TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
	// The EndpointID property is not available for these stacks, this API endpoint
	// can use the optional EndpointID query parameter to associate a valid environment(endpoint) identifier to the stack.
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}

	var stack *portainer.Stack
	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var httpErr *httperror.HandlerError
		stack, httpErr = handler.updateStackInTx(tx, r, portainer.StackID(stackID), portainer.EndpointID(endpointID))
		if httpErr != nil {
			return httpErr
		}
		return nil
	})
	return response.TxResponse(w, stack, err)
}

func (handler *Handler) updateStackInTx(tx dataservices.DataStoreTx, r *http.Request, stackID portainer.StackID, endpointID portainer.EndpointID) (*portainer.Stack, *httperror.HandlerError) {
	stack, err := tx.Stack().Read(stackID)
	if tx.IsErrObjectNotFound(err) {
		return nil, httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return nil, httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	if stack.Status == portainer.StackStatusDeploying {
		return nil, httperror.Conflict("Unable to update stack", errors.New("Stack deployment is already in progress"))
	}

	if endpointID != 0 && endpointID != stack.EndpointID {
		stack.EndpointID = endpointID
	}

	endpoint, err := tx.Endpoint().Endpoint(stack.EndpointID)
	if tx.IsErrObjectNotFound(err) {
		return nil, httperror.NotFound("Unable to find the environment associated to the stack inside the database", err)
	} else if err != nil {
		return nil, httperror.InternalServerError("Unable to find the environment associated to the stack inside the database", err)
	}

	if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
		return nil, httperror.Forbidden("Permission denied to access environment", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	//only check resource control when it is a DockerSwarmStack or a DockerComposeStack
	if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
		resourceControl, err := tx.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
		}

		if access, err := handler.userCanAccessStack(securityContext, resourceControl); err != nil {
			return nil, httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
		} else if !access {
			return nil, httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
		}
	}

	if canManage, err := handler.userCanManageStacks(securityContext, endpoint); err != nil {
		return nil, httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	} else if !canManage {
		errMsg := "Stack editing is disabled for non-admin users"

		return nil, httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	deployGate := newDeployGate()
	if err := handler.updateAndDeployStack(tx, r, stack, endpoint, deployGate); err != nil {
		return nil, err
	}

	user, err := tx.User().Read(securityContext.UserID)
	if err != nil {
		return nil, httperror.BadRequest("Cannot find context user", errors.Wrap(err, "failed to fetch the user"))
	}

	stack.UpdatedBy = user.Username
	stack.UpdateDate = time.Now().Unix()
	stackutils.PrepareStackStatusForDeployment(stack)

	if err := tx.Stack().Update(stack.ID, stack); err != nil {
		deployGate.abortDeploy()
		return nil, httperror.InternalServerError("Unable to persist the stack changes inside the database", err)
	}

	deployGate.startDeploy()

	userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
	if err := fillStackGitConfig(tx, userContext, stack); err != nil {
		return nil, httperror.InternalServerError("Unable to load git config for stack", err)
	}

	return stack, nil
}

func (handler *Handler) updateAndDeployStack(tx dataservices.DataStoreTx, r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint, gate *deployGate) *httperror.HandlerError {
	switch stack.Type {
	case portainer.DockerSwarmStack:
		stack.Name = handler.SwarmStackManager.NormalizeStackName(stack.Name)

		return handler.updateSwarmStack(tx, r, stack, endpoint, gate)
	case portainer.DockerComposeStack:
		stack.Name = handler.ComposeStackManager.NormalizeStackName(stack.Name)

		return handler.updateComposeStack(tx, r, stack, endpoint, gate)
	case portainer.KubernetesStack:
		return handler.updateKubernetesStack(tx, r, stack, endpoint, gate)
	}

	return httperror.InternalServerError("Unsupported stack", errors.Errorf("unsupported stack type: %v", stack.Type))
}

func (handler *Handler) updateComposeStack(tx dataservices.DataStoreTx, r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint, gate *deployGate) *httperror.HandlerError {
	// Must not be git based stack. stop the auto update job if there is any
	if stack.AutoUpdate != nil {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
		stack.AutoUpdate = nil
	}
	if stack.WorkflowID != 0 {
		stack.FromAppTemplate = true
	}

	var payload updateComposeStackPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	payload.RepullImageAndRedeploy = payload.RepullImageAndRedeploy || payload.PullImage
	stack.Env = payload.Env

	if stack.WorkflowID != 0 {
		oldWorkflowID := stack.WorkflowID
		stack.WorkflowID = 0
		if err := tx.Workflow().Delete(oldWorkflowID); err != nil {
			return httperror.InternalServerError("Unable to remove git workflow records from database", err)
		}
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	if _, err := handler.FileService.UpdateStoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent)); err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError("Unable to persist updated Compose file on disk", err)
	}

	// Create compose deployment config
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	composeDeploymentConfig, err := deployments.CreateComposeStackDeploymentConfigTx(tx, securityContext,
		stack,
		endpoint,
		handler.FileService,
		handler.StackDeployer,
		payload.Prune,
		payload.RepullImageAndRedeploy,
		payload.RepullImageAndRedeploy)
	if err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError(err.Error(), err)
	}

	if stack.Option != nil {
		stack.Option.Prune = payload.Prune
	} else {
		stack.Option = &portainer.StackOption{
			Prune: payload.Prune,
		}
	}

	postDeploy := func(ctx context.Context, deployErr error) {
		if deployErr != nil {
			if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
				log.Warn().Err(rollbackErr).Msg("rollback stack file error")
			}
			return
		}

		if err := handler.FileService.RemoveStackFileBackup(stackFolder, stack.EntryPoint); err != nil {
			log.Warn().Err(err).Msg("remove stack file backup error")
		}
	}

	go stackDeploy(handler.DataStore, stack.ID, composeDeploymentConfig, gate, postDeploy)

	return nil
}

func (handler *Handler) updateSwarmStack(tx dataservices.DataStoreTx, r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint, gate *deployGate) *httperror.HandlerError {
	// Must not be git based stack. stop the auto update job if there is any
	if stack.AutoUpdate != nil {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
		stack.AutoUpdate = nil
	}
	if stack.WorkflowID != 0 {
		stack.FromAppTemplate = true
	}

	var payload updateSwarmStackPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}
	payload.RepullImageAndRedeploy = payload.RepullImageAndRedeploy || payload.PullImage
	stack.Env = payload.Env

	if stack.WorkflowID != 0 {
		oldWorkflowID := stack.WorkflowID
		stack.WorkflowID = 0
		if err := tx.Workflow().Delete(oldWorkflowID); err != nil {
			return httperror.InternalServerError("Unable to remove git workflow records from database", err)
		}
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	if _, err := handler.FileService.UpdateStoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent)); err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError("Unable to persist updated Compose file on disk", err)
	}

	// Create swarm deployment config
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	swarmDeploymentConfig, err := deployments.CreateSwarmStackDeploymentConfigTx(tx, securityContext,
		stack,
		endpoint,
		handler.FileService,
		handler.StackDeployer,
		payload.Prune,
		payload.RepullImageAndRedeploy)
	if err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError(err.Error(), err)
	}

	if stack.Option != nil {
		stack.Option.Prune = payload.Prune
	} else {
		stack.Option = &portainer.StackOption{
			Prune: payload.Prune,
		}
	}

	postDeploy := func(ctx context.Context, deployErr error) {
		if deployErr != nil {
			if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
				log.Warn().Err(rollbackErr).Msg("rollback stack file error")
			}
			return
		}

		if err := handler.FileService.RemoveStackFileBackup(stackFolder, stack.EntryPoint); err != nil {
			log.Warn().Err(err).Msg("remove stack file backup error")
		}
	}

	go stackDeploy(handler.DataStore, stack.ID, swarmDeploymentConfig, gate, postDeploy)

	return nil
}

func stackDeploy(dataStore dataservices.DataStore, stackID portainer.StackID, stackDeploymentConfig deployments.StackDeploymentConfiger, gate *deployGate, postDeploy postDeployFunc) {
	// Wait until stack update payload is persisted
	if !gate.wait() {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	shouldUndeploy := false
	if err := dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		stack, err := tx.Stack().Read(stackID)
		if err != nil {
			return err
		}

		shouldUndeploy = stack.Status == portainer.StackStatusDeploying && stack.DeploymentStartStatus == portainer.StackStatusError
		return nil
	}); err != nil {
		log.Error().Err(err).
			Int("stack_id", int(stackID)).
			Str("context", "stackDeploy").
			Msg("Failed to determine stack status before async deployment")
		return
	}

	if shouldUndeploy {
		if undeployErr := stackDeploymentConfig.Undeploy(ctx); undeployErr != nil {
			if err := dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
				stack, err := tx.Stack().Read(stackID)
				if err != nil {
					return err
				}

				stackutils.UpdateStackStatusFromUndeploymentResult(stack, undeployErr)
				return tx.Stack().Update(stack.ID, stack)
			}); err != nil {
				log.Error().Err(err).
					AnErr("undeploy_error", undeployErr).
					Int("stack_id", int(stackID)).
					Str("context", "stackDeploy").
					Msg("Failed to update stack status before async deployment")
				return
			}
		}
	}

	deployErr := stackDeploymentConfig.Deploy(ctx)

	if err := dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack, err := tx.Stack().Read(stackID)
		if err != nil {
			return err
		}

		stackutils.UpdateStackStatusFromDeploymentResult(stack, deployErr)
		return tx.Stack().Update(stack.ID, stack)
	}); err != nil {
		log.Error().Err(err).
			AnErr("deploy_error", deployErr).
			Int("stack_id", int(stackID)).
			Str("context", "stackDeploy").
			Msg("Failed to update stack status after async deployment")
		return
	}

	if postDeploy != nil {
		postDeploy(ctx, deployErr)
	}
}
