package webhooks

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/satori/go.uuid"
)

type webhookCreatePayload struct {
	ResourceID  string
	EndpointID  int
	WebhookType int
}

func (payload *webhookCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.ResourceID) {
		return portainer.Error("Invalid ResourceID")
	}
	if payload.EndpointID == 0 {
		return portainer.Error("Invalid EndpointID")
	}
	if payload.WebhookType != 1 {
		return portainer.Error("Invalid WebhookType")
	}
	return nil
}

func (handler *Handler) webhookCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload webhookCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	webhook, err := handler.WebhookService.WebhookByResourceID(payload.ResourceID)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "An error occurred retrieving webhooks from the database", err}
	}
	if webhook != nil {
		return &httperror.HandlerError{http.StatusConflict, "A webhook for this resource already exists", portainer.ErrWebhookAlreadyExists}
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

	err = handler.WebhookService.CreateWebhook(webhook)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the webhook inside the database", err}
	}

	return response.JSON(w, webhook)
}
