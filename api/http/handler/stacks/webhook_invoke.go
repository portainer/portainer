package stacks

import (
	"net/http"

	"github.com/gofrs/uuid"
	"github.com/sirupsen/logrus"

	"github.com/portainer/libhttp/response"

	"github.com/portainer/portainer/api/stacks"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
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
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid webhook identifier route variable", Err: err}
	}

	stack, err := handler.DataStore.Stack().StackByWebhookID(webhookID.String())
	if err != nil {
		statusCode := http.StatusInternalServerError
		if handler.DataStore.IsErrObjectNotFound(err) {
			statusCode = http.StatusNotFound
		}
		return &httperror.HandlerError{StatusCode: statusCode, Message: "Unable to find the stack by webhook ID", Err: err}
	}

	if err = stacks.RedeployWhenChanged(stack.ID, handler.StackDeployer, handler.DataStore, handler.GitService); err != nil {
		if _, ok := err.(*stacks.StackAuthorMissingErr); ok {
			return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: "Autoupdate for the stack isn't available", Err: err}
		}
		logrus.WithError(err).Error("failed to update the stack")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to update the stack", Err: err}
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
