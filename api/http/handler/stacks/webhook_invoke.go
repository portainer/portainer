package stacks

import (
	"cmp"
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/deployments"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/gofrs/uuid"
)

// @id WebhookInvoke
// @summary Webhook for triggering stack updates from git
// @description **Access policy**: public
// @tags stacks
// @param webhookID path string true "Stack identifier"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 409 "Autoupdate for the stack isn't available"
// @failure 500 "Server error"
// @router /stacks/webhooks/{webhookID} [post]
func (handler *Handler) webhookInvoke(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	webhookID, err := retrieveUUIDRouteVariableValue(r, "webhookID")
	if err != nil {
		return httperror.BadRequest("Invalid webhook identifier route variable", err)
	}

	stack, err := handler.DataStore.Stack().StackByWebhookID(webhookID.String())
	if err != nil {
		statusCode := http.StatusInternalServerError
		if handler.DataStore.IsErrObjectNotFound(err) {
			statusCode = http.StatusNotFound
		}

		return httperror.NewError(statusCode, "Unable to find the stack by webhook ID", err)
	}

	// For Git-based stacks, use the existing RedeployWhenChanged logic
	if stack.GitConfig != nil {
		if err = deployments.RedeployWhenChanged(stack.ID, handler.StackDeployer, handler.DataStore, handler.GitService); err != nil {
			var StackAuthorMissingErr *deployments.StackAuthorMissingErr
			if errors.As(err, &StackAuthorMissingErr) {
				return httperror.Conflict("Autoupdate for the stack isn't available", err)
			}

			return httperror.InternalServerError("Failed to update the stack", err)
		}
		return response.Empty(w)
	}

	// For non-Git stacks, redeploy directly
	return handler.redeployStack(w, stack)
}

func (handler *Handler) redeployStack(w http.ResponseWriter, stack *portainer.Stack) *httperror.HandlerError {
	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find the environment associated to the stack", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find the environment associated to the stack", err)
	}

	// Get the stack author
	author := cmp.Or(stack.UpdatedBy, stack.CreatedBy)
	user, err := handler.DataStore.User().UserByUsername(author)
	if err != nil {
		return httperror.InternalServerError("Unable to find stack author", err)
	}

	// Get user memberships for registry filtering
	memberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user memberships", err)
	}

	securityContext := &security.RestrictedRequestContext{
		IsAdmin:         user.Role == portainer.AdministratorRole,
		UserID:          user.ID,
		UserMemberships: memberships,
	}

	switch stack.Type {
	case portainer.DockerSwarmStack:
		config, err := deployments.CreateSwarmStackDeploymentConfig(securityContext, stack, endpoint, handler.DataStore, handler.FileService, handler.StackDeployer, false, true)
		if err != nil {
			return httperror.InternalServerError("Failed to create deployment config", err)
		}
		if err := config.Deploy(); err != nil {
			return httperror.InternalServerError("Failed to redeploy stack", err)
		}
	case portainer.DockerComposeStack:
		config, err := deployments.CreateComposeStackDeploymentConfig(securityContext, stack, endpoint, handler.DataStore, handler.FileService, handler.StackDeployer, true, true)
		if err != nil {
			return httperror.InternalServerError("Failed to create deployment config", err)
		}
		if err := config.Deploy(); err != nil {
			return httperror.InternalServerError("Failed to redeploy stack", err)
		}
	default:
		return httperror.InternalServerError("Unsupported stack type for webhook", errors.New("unsupported stack type"))
	}

	return response.Empty(w)
}

func retrieveUUIDRouteVariableValue(r *http.Request, name string) (uuid.UUID, error) {
	webhookID, err := request.RetrieveRouteVariableValue(r, name)
	if err != nil {
		return uuid.Nil, err
	}

	uid, err := uuid.FromString(webhookID)
	if err != nil {
		return uuid.Nil, err
	}

	return uid, nil
}
