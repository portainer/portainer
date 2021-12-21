package webhooks

import (
	"github.com/portainer/portainer/api/dataservices"
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

	endpoint, err := handler.DataStore.Endpoint().Endpoint(webhook.EndpointID)
	if dataservices.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	}

	// No OperationPortainerWebhookUpdate for now
	authorizations := []portainer.Authorization{portainer.OperationPortainerWebhookCreate}
	var resourceType portainer.ResourceControlType
	if portainer.WebhookType(webhook.WebhookType) == portainer.ServiceWebhook {
		resourceType = portainer.ServiceResourceControl
		authorizations = append(authorizations, portainer.OperationDockerServiceUpdate)
	}

	isAuthorized, handlerErr := handler.checkAuthorization(r, endpoint, authorizations)
	if handlerErr != nil {
		return handlerErr
	}
	if !isAuthorized && resourceType != 0{
		handlerErr := handler.checkResourceAccess(r, webhook.ResourceID, resourceType)
		if handlerErr != nil {
			return handlerErr
		}
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
