package stacks

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

type stackMigratePayload struct {
	EndpointID int
	SwarmID    string
	Name       string
}

func (payload *stackMigratePayload) Validate(r *http.Request) error {
	if payload.EndpointID == 0 {
		return errors.New("Invalid endpoint identifier. Must be a positive number")
	}
	return nil
}

// @summary Migrates a Stack to another endpoint
// @tags stacks
// @security jwt
// @accept json
// @produce json
// @param id path string true "Stack Id"
// @param endpointId query int false "Endpoint Id"
// @param body body stackMigratePayload true "Stack data"
// @success 200 {object} portainer.Stack
// @failure 400,403,404,500
// @router /stacks/{id}/migrate [post]
func (handler *Handler) stackMigrate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	var payload stackMigratePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	stack, err := handler.DataStore.Stack().Stack(portainer.StackID(stackID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a stack with the specified identifier inside the database", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(stack.Name, portainer.StackResourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a resource control associated to the stack", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	access, err := handler.userCanAccessStack(securityContext, endpoint.ID, resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to verify user authorizations to validate stack access", err}
	}
	if !access {
		return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", httperrors.ErrResourceAccessDenied}
	}

	// TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
	// The EndpointID property is not available for these stacks, this API endpoint
	// can use the optional EndpointID query parameter to associate a valid endpoint identifier to the stack.
	endpointID, err := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: endpointId", err}
	}
	if endpointID != int(stack.EndpointID) {
		stack.EndpointID = portainer.EndpointID(endpointID)
	}

	targetEndpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(payload.EndpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	stack.EndpointID = portainer.EndpointID(payload.EndpointID)
	if payload.SwarmID != "" {
		stack.SwarmID = payload.SwarmID
	}

	oldName := stack.Name
	if payload.Name != "" {
		stack.Name = payload.Name
	}

	migrationError := handler.migrateStack(r, stack, targetEndpoint)
	if migrationError != nil {
		return migrationError
	}

	stack.Name = oldName
	err = handler.deleteStack(stack, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	err = handler.DataStore.Stack().UpdateStack(stack.ID, stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack changes inside the database", err}
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
	config, configErr := handler.createComposeDeployConfig(r, stack, next)
	if configErr != nil {
		return configErr
	}

	err := handler.deployComposeStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	return nil
}

func (handler *Handler) migrateSwarmStack(r *http.Request, stack *portainer.Stack, next *portainer.Endpoint) *httperror.HandlerError {
	config, configErr := handler.createSwarmDeployConfig(r, stack, next, true)
	if configErr != nil {
		return configErr
	}

	err := handler.deploySwarmStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	return nil
}
