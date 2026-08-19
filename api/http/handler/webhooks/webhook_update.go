package webhooks

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils/access"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
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
// @param id path int true "Webhook id"
// @param body body webhookUpdatePayload true "Webhook data"
// @success 200 {object} portainer.Webhook
// @failure 400
// @failure 409
// @failure 500
// @router /webhooks/{id} [put]
func (handler *Handler) webhookUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid webhook id", err)
	}
	webhookID := portainer.WebhookID(id)

	var payload webhookUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	webhook, err := handler.DataStore.Webhook().Read(webhookID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a webhooks with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a webhooks with the specified identifier inside the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user info from request context", err)
	}

	if !securityContext.IsAdmin {
		return httperror.Forbidden("Not authorized to update a webhook", errors.New("not authorized to update a webhook"))
	}

	if payload.RegistryID != 0 {
		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve user authentication token", err)
		}

		_, err = access.GetAccessibleRegistry(handler.DataStore, nil, tokenData.ID, webhook.EndpointID, payload.RegistryID)
		if err != nil {
			return httperror.Forbidden("Permission deny to access registry", err)
		}
	}

	webhook.RegistryID = payload.RegistryID

	err = handler.DataStore.Webhook().Update(portainer.WebhookID(id), webhook)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the webhook inside the database", err)
	}

	return response.JSON(w, webhook)
}
