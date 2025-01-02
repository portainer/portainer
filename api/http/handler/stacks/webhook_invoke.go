package stacks

import (
	"errors"
	"net/http"

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

	if err = deployments.RedeployWhenChanged(stack.ID, handler.StackDeployer, handler.DataStore, handler.GitService); err != nil {
		var StackAuthorMissingErr *deployments.StackAuthorMissingErr
		if errors.As(err, &StackAuthorMissingErr) {
			return httperror.Conflict("Autoupdate for the stack isn't available", err)
		}

		return httperror.InternalServerError("Failed to update the stack", err)
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
