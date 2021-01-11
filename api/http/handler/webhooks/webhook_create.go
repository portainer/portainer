package webhooks

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/gofrs/uuid"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
)

type webhookCreatePayload struct {
	ResourceID  string
	EndpointID  int
	WebhookType int
}

func (payload *webhookCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.ResourceID) {
		return errors.New("Invalid ResourceID")
	}
	if payload.EndpointID == 0 {
		return errors.New("Invalid EndpointID")
	}
	if payload.WebhookType != 1 {
		return errors.New("Invalid WebhookType")
	}
	return nil
}

// @summary Create a webhook
// @description
// @security ApiKeyAuth
// @tags Webhooks
// @accept json
// @produce json
// @param body body webhookCreatePayload true "Webhook data"
// @success 200 {object} portainer.Webhook
// @failure 400,409,500
// @router /webhooks [post]
func (handler *Handler) webhookCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload webhookCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	webhook, err := handler.DataStore.Webhook().WebhookByResourceID(payload.ResourceID)
	if err != nil && err != bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "An error occurred retrieving webhooks from the database", err}
	}
	if webhook != nil {
		return &httperror.HandlerError{http.StatusConflict, "A webhook for this resource already exists", errors.New("A webhook for this resource already exists")}
	}

	token, err := uuid.NewV4()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error creating unique token", err}
	}

	webhook = &portainer.Webhook{
		Token:       token.String(),
		ResourceID:  payload.ResourceID,
		EndpointID:  portainer.EndpointID(payload.EndpointID),
		WebhookType: portainer.WebhookType(payload.WebhookType),
	}

	err = handler.DataStore.Webhook().CreateWebhook(webhook)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the webhook inside the database", err}
	}

	return response.JSON(w, webhook)
}
