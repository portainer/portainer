package stacks

import (
	"errors"
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type stackMigratePayload struct {
	// Environment(Endpoint) identifier of the target environment(endpoint) where the stack will be relocated
	EndpointID int `example:"2" validate:"required"`
	// Swarm cluster identifier, must match the identifier of the cluster where the stack will be relocated
	SwarmID string `example:"jpofkc0i9uo9wtx1zesuk649w"`
	// If provided will rename the migrated stack
	Name string `example:"new-stack"`
}

func (payload *stackMigratePayload) Validate(r *http.Request) error {
	if payload.EndpointID == 0 {
		return errors.New("Invalid environment identifier. Must be a positive number")
	}
	return nil
}

// @id StackMigrate
// @summary Migrate a stack to another environment(endpoint)
// @description  Migrate a stack from an environment(endpoint) to another environment(endpoint). It will re-create the stack inside the target environment(endpoint) before removing the original stack.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Stack identifier"
// @param endpointId query int false "Stacks created before version 1.18.0 might not have an associated environment(endpoint) identifier. Use this optional parameter to set the environment(endpoint) identifier used by the stack."
// @param body body stackMigratePayload true "Stack migration details"
// @success 200 {object} portainer.Stack "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Stack not found"
// @failure 409 "A stack with the same name is already running on the target environment(endpoint)"
// @failure 500 "Server error"
// @router /stacks/{id}/migrate [post]
func (handler *Handler) stackMigrate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	var payload stackMigratePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	stack, err := handler.DataStore.Stack().Read(portainer.StackID(stackID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a stack with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a stack with the specified identifier inside the database", err)
	}

	if stack.Type == portainer.KubernetesStack {
		return httperror.BadRequest("Migrating a kubernetes stack is not supported", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an endpoint with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an endpoint with the specified identifier inside the database", err)
	}

	if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
		return httperror.Forbidden("Permission denied to access endpoint", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	canManage, err := handler.userCanManageStacks(securityContext, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to verify user authorizations to validate stack deletion", err)
	}
	if !canManage {
		errMsg := "Stack migration is disabled for non-admin users"
		return httperror.Forbidden(errMsg, errors.New(errMsg))
	}

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

	// TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
	// The EndpointID property is not available for these stacks, this API environment(endpoint)
	// can use the optional EndpointID query parameter to associate a valid environment(endpoint) identifier to the stack.
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: endpointId", err)
	}
	if endpointID != int(stack.EndpointID) {
		stack.EndpointID = portainer.EndpointID(endpointID)
	}

	targetEndpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(payload.EndpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an endpoint with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an endpoint with the specified identifier inside the database", err)
	}

	stack.EndpointID = portainer.EndpointID(payload.EndpointID)
	if payload.SwarmID != "" {
		stack.SwarmID = payload.SwarmID
	}

	oldName := stack.Name
	if payload.Name != "" {
		stack.Name = payload.Name
	}

	isUnique, err := handler.checkUniqueStackNameInDocker(targetEndpoint, stack.Name, stack.ID, stack.SwarmID != "")
	if err != nil {
		return httperror.InternalServerError("Unable to check for name collision", err)
	}

	if !isUnique {
		errorMessage := fmt.Sprintf("A stack with the name '%s' is already running on endpoint '%s'", stack.Name, targetEndpoint.Name)
		return httperror.Conflict(errorMessage, errors.New(errorMessage))
	}

	migrationError := handler.migrateStack(r, stack, targetEndpoint)
	if migrationError != nil {
		return migrationError
	}

	newName := stack.Name
	stack.Name = oldName
	if err := handler.deleteStack(securityContext.UserID, stack, endpoint); err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	stack.Name = newName
	if err := handler.DataStore.Stack().Update(stack.ID, stack); err != nil {
		return httperror.InternalServerError("Unable to persist the stack changes inside the database", err)
	}

	if resourceControl != nil {
		resourceControl.ResourceID = stackutils.ResourceControlID(stack.EndpointID, stack.Name)
		err := handler.DataStore.ResourceControl().Update(resourceControl.ID, resourceControl)
		if err != nil {
			return httperror.InternalServerError("Unable to persist the resource control changes", err)
		}
	}

	if stack.GitConfig != nil && stack.GitConfig.Authentication != nil && stack.GitConfig.Authentication.Password != "" {
		// sanitize password in the http response to minimise possible security leaks
		stack.GitConfig.Authentication.Password = ""
	}

	return response.JSON(w, stack)
}

func (handler *Handler) migrateStack(r *http.Request, stack *portainer.Stack, next *portainer.Endpoint) *httperror.HandlerError {
	if stack.Type == portainer.DockerSwarmStack {
		return handler.migrateSwarmStack(r, stack, next)
	}
	return handler.migrateComposeStack(r, stack, next)
}

func (handler *Handler) migrateComposeStack(r *http.Request, stack *portainer.Stack, next *portainer.Endpoint) *httperror.HandlerError {
	// Create compose deployment config
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	composeDeploymentConfig, err := deployments.CreateComposeStackDeploymentConfig(securityContext,
		stack,
		next,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer,
		false,
		false)
	if err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	// Deploy the stack
	if err := composeDeploymentConfig.Deploy(); err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	return nil
}

func (handler *Handler) migrateSwarmStack(r *http.Request, stack *portainer.Stack, next *portainer.Endpoint) *httperror.HandlerError {
	// Create swarm deployment config
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	swarmDeploymentConfig, err := deployments.CreateSwarmStackDeploymentConfig(securityContext,
		stack,
		next,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer,
		true,
		true)
	if err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	// Deploy the stack
	if err := swarmDeploymentConfig.Deploy(); err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	return nil
}
