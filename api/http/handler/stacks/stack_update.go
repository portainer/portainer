package stacks

import (
	"net/http"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"
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

type updateComposeStackPayload struct {
	// New content of the Stack file
	StackFileContent string `example:"version: 3\n services:\n web:\n image:nginx"`
	// A list of environment(endpoint) variables used during stack deployment
	Env []portainer.Pair
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
	// Prune services that are no longer referenced (only available for Swarm stacks)
	Prune bool `example:"true"`
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
// @failure 500 "Server error"
// @router /stacks/{id} [put]
func (handler *Handler) stackUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	stack, err := handler.DataStore.Stack().Read(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	// TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
	// The EndpointID property is not available for these stacks, this API endpoint
	// can use the optional EndpointID query parameter to associate a valid environment(endpoint) identifier to the stack.
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", false)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}
	if endpointID != int(stack.EndpointID) {
		stack.EndpointID = portainer.EndpointID(endpointID)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find the environment associated to the stack inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find the environment associated to the stack inside the database", err)
	}

	if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	//only check resource control when it is a DockerSwarmStack or a DockerComposeStack
	if stack.Type == portainer.DockerSwarmStack || stack.Type == portainer.DockerComposeStack {
		resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve a resource control associated to the stack", err)
		}

		if access, err := handler.userCanAccessStack(securityContext, endpoint.ID, resourceControl); err != nil {
			return httperror.InternalServerError("Unable to verify user authorizations to validate stack access", err)
		} else if !access {
			return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
		}
	}

	if canManage, err := handler.userCanManageStacks(securityContext, endpoint); err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	} else if !canManage {
		errMsg := "Stack editing is disabled for non-admin users"

		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

	if err := handler.updateAndDeployStack(r, stack, endpoint); err != nil {
		return err
	}

	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return httperror.BadRequest("Cannot find context user", errors.Wrap(err, "failed to fetch the user"))
	}

	stack.UpdatedBy = user.Username
	stack.UpdateDate = time.Now().Unix()
	stack.Status = portainer.StackStatusActive

	if err := handler.DataStore.Stack().Update(stack.ID, stack); err != nil {
		return httperror.InternalServerError("Unable to persist the stack changes inside the database", err)
	}

	if stack.GitConfig != nil && stack.GitConfig.Authentication != nil && stack.GitConfig.Authentication.Password != "" {
		// Sanitize password in the http response to minimise possible security leaks
		stack.GitConfig.Authentication.Password = ""
	}

	return response.JSON(w, stack)
}

func (handler *Handler) updateAndDeployStack(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) *httperror.HandlerError {
	switch stack.Type {
	case portainer.DockerSwarmStack:
		stack.Name = handler.SwarmStackManager.NormalizeStackName(stack.Name)

		return handler.updateSwarmStack(r, stack, endpoint)
	case portainer.DockerComposeStack:
		stack.Name = handler.ComposeStackManager.NormalizeStackName(stack.Name)

		return handler.updateComposeStack(r, stack, endpoint)
	case portainer.KubernetesStack:
		return handler.updateKubernetesStack(r, stack, endpoint)
	}

	return httperror.InternalServerError("Unsupported stack", errors.Errorf("unsupported stack type: %v", stack.Type))
}

func (handler *Handler) updateComposeStack(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) *httperror.HandlerError {
	// Must not be git based stack. stop the auto update job if there is any
	if stack.AutoUpdate != nil {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
		stack.AutoUpdate = nil
	}
	if stack.GitConfig != nil {
		stack.FromAppTemplate = true
	}

	var payload updateComposeStackPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	stack.Env = payload.Env

	if stack.GitConfig != nil {
		// detach from git
		stack.GitConfig = nil
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

	composeDeploymentConfig, err := deployments.CreateComposeStackDeploymentConfig(securityContext,
		stack,
		endpoint,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer,
		payload.PullImage,
		false)
	if err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError(err.Error(), err)
	}

	// Deploy the stack
	if err := composeDeploymentConfig.Deploy(); err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError(err.Error(), err)
	}

	handler.FileService.RemoveStackFileBackup(stackFolder, stack.EntryPoint)

	return nil
}

func (handler *Handler) updateSwarmStack(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) *httperror.HandlerError {
	// Must not be git based stack. stop the auto update job if there is any
	if stack.AutoUpdate != nil {
		deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
		stack.AutoUpdate = nil
	}
	if stack.GitConfig != nil {
		stack.FromAppTemplate = true
	}

	var payload updateSwarmStackPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	stack.Env = payload.Env

	if stack.GitConfig != nil {
		// detach from git
		stack.GitConfig = nil
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

	swarmDeploymentConfig, err := deployments.CreateSwarmStackDeploymentConfig(securityContext,
		stack,
		endpoint,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer,
		payload.Prune,
		payload.PullImage)
	if err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError(err.Error(), err)
	}

	// Deploy the stack
	if err := swarmDeploymentConfig.Deploy(); err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError(err.Error(), err)
	}

	handler.FileService.RemoveStackFileBackup(stackFolder, stack.EntryPoint)

	return nil
}
