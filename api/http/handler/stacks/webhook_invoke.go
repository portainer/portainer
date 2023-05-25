package stacks

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/stacks/deployments"

	"github.com/gofrs/uuid"
)

// @id WebhookInvoke
// @summary Webhook for triggering stack updates from git
// @description **Access policy**: public
// @tags stacks
// @param webhookID path string true "Stack identifier"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 409 "Conflict"
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

		return &httperror.HandlerError{StatusCode: statusCode, Message: "Unable to find the stack by webhook ID", Err: err}
	}

	if err = deployments.RedeployWhenChanged(stack.ID, handler.StackDeployer, handler.DataStore, handler.GitService); err != nil {
		var StackAuthorMissingErr *deployments.StackAuthorMissingErr
		if errors.As(err, &StackAuthorMissingErr) {
			return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: "Autoupdate for the stack isn't available", Err: err}
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
