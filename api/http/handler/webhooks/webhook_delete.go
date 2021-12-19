package webhooks

import (
	"github.com/portainer/portainer/api/dataservices"
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
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid webhook id", err}
	}

	webhook, err := handler.DataStore.Webhook().Webhook(portainer.WebhookID(id))
	if dataservices.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find a webhook with this token", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve webhook from the database", Err: err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(webhook.EndpointID)
	if dataservices.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	}

	var resourceType portainer.ResourceControlType
	if webhook.WebhookType == portainer.ServiceWebhook {
		resourceType = portainer.ServiceResourceControl
	}
	if resourceType != 0 {
		handlerErr := handler.checkResourceAccess(r, endpoint, webhook.ResourceID, resourceType)
		if handlerErr != nil {
			return handlerErr
		}
	}

	err = handler.DataStore.Webhook().DeleteWebhook(portainer.WebhookID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the webhook from the database", err}
	}

	return response.Empty(w)
}
