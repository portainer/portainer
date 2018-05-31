package stacks

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

type updateComposeStackPayload struct {
	StackFileContent string
}

func (payload *updateComposeStackPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.StackFileContent) {
		return portainer.Error("Invalid stack file content")
	}
	return nil
}

type updateSwarmStackPayload struct {
	StackFileContent string
	Env              []portainer.Pair
	Prune            bool
}

func (payload *updateSwarmStackPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.StackFileContent) {
		return portainer.Error("Invalid stack file content")
	}
	return nil
}

// PUT request on /api/stacks/:id
func (handler *Handler) stackUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	stack, err := handler.StackService.Stack(portainer.StackID(stackID))
	if err == portainer.ErrStackNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a stack with the specified identifier inside the database", err}
	}

	resourceControl, err := handler.ResourceControlService.ResourceControlByResourceID(stack.Name)
	if err != nil && err != portainer.ErrResourceControlNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a resource control associated to the stack", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if resourceControl != nil {
		if !securityContext.IsAdmin && !proxy.CanAccessStack(stack, resourceControl, securityContext.UserID, securityContext.UserMemberships) {
			return &httperror.HandlerError{http.StatusForbidden, "Access denied to resource", portainer.ErrResourceAccessDenied}
		}
	}

	endpoint, err := handler.EndpointService.Endpoint(stack.EndpointID)
	if err == portainer.ErrEndpointNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find the endpoint associated to the stack inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find the endpoint associated to the stack inside the database", err}
	}

	updateError := handler.updateAndDeployStack(r, stack, endpoint)
	if updateError != nil {
		return updateError
	}

	err = handler.StackService.UpdateStack(stack.ID, stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack changes inside the database", err}
	}

	return response.JSON(w, stack)
}

func (handler *Handler) updateAndDeployStack(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) *httperror.HandlerError {
	if stack.Type == portainer.DockerSwarmStack {
		return handler.updateSwarmStack(r, stack, endpoint)
	}
	return handler.updateComposeStack(r, stack, endpoint)
}

func (handler *Handler) updateComposeStack(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) *httperror.HandlerError {
	var payload updateComposeStackPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	_, err = handler.FileService.StoreStackFileFromBytes(string(stack.ID), stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist updated Compose file on disk", err}
	}

	config, configErr := handler.createComposeDeployConfig(r, stack, endpoint)
	if configErr != nil {
		return configErr
	}

	err = handler.deployComposeStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to deploy updated stack", err}
	}

	return nil
}

func (handler *Handler) updateSwarmStack(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) *httperror.HandlerError {
	var payload updateSwarmStackPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	stack.Env = payload.Env

	_, err = handler.FileService.StoreStackFileFromBytes(string(stack.ID), stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist updated Compose file on disk", err}
	}

	config, configErr := handler.createSwarmDeployConfig(r, stack, endpoint, payload.Prune)
	if configErr != nil {
		return configErr
	}

	err = handler.deploySwarmStack(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to deploy updated stack", err}
	}

	return nil
}
