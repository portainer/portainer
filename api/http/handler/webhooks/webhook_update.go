package webhooks

import (
	"errors"
	"net/http"

	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils/access"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type webhookUpdatePayload struct {
	RegistryID portainer.RegistryID
}

func (payload *webhookUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// @summary Update a webhook
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags webhooks
// @accept json
// @produce json
// @param body body webhookUpdatePayload true "Webhook data"
// @success 200 {object} portainer.Webhook
// @failure 400
// @failure 409
// @failure 500
// @router /webhooks/{id} [put]
func (handler *Handler) webhookUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid webhook id", err}
	}
	webhookID := portainer.WebhookID(id)

	var payload webhookUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	webhook, err := handler.DataStore.Webhook().Webhook(webhookID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a webhooks with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a webhooks with the specified identifier inside the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve user info from request context", Err: err}
	}

	if !securityContext.IsAdmin {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Not authorized to update a webhook", Err: errors.New("not authorized to update a webhook")}
	}

	if payload.RegistryID != 0 {
		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
		}

		_, err = access.GetAccessibleRegistry(handler.DataStore, tokenData.ID, webhook.EndpointID, payload.RegistryID)
		if err != nil {
			return &httperror.HandlerError{http.StatusForbidden, "Permission deny to access registry", err}
		}
	}

	webhook.RegistryID = payload.RegistryID

	err = handler.DataStore.Webhook().UpdateWebhook(portainer.WebhookID(id), webhook)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the webhook inside the database", err}
	}

	return response.JSON(w, webhook)
}
