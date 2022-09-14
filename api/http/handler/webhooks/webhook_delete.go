package webhooks

import (
	"errors"
	"github.com/portainer/portainer/api/http/security"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @summary Delete a webhook
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags webhooks
// @param id path int true "Webhook id"
// @success 202 "Webhook deleted"
// @failure 400
// @failure 500
// @router /webhooks/{id} [delete]
func (handler *Handler) webhookDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid webhook id", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user info from request context", err)
	}

	if !securityContext.IsAdmin {
		return httperror.Forbidden("Not authorized to delete a webhook", errors.New("not authorized to delete a webhook"))
	}

	err = handler.DataStore.Webhook().DeleteWebhook(portainer.WebhookID(id))
	if err != nil {
		return httperror.InternalServerError("Unable to remove the webhook from the database", err)
	}

	return response.Empty(w)
}
