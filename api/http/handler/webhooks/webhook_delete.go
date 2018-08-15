package webhooks

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

// DELETE request on /api/webhook/:id
func (handler *Handler) webhookDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	serviceID, err := request.RetrieveRouteVariableValue(r, "serviceID")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid serviceID", err}
	}
	webhook, err := handler.WebhookService.WebhookByServiceID(serviceID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find webhook to remove", err}
	}

	err = handler.WebhookService.DeleteWebhook(webhook.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the webhook from the database", err}
	}

	return response.Empty(w)
}
