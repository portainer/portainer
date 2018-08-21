package webhooks

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
	"github.com/satori/go.uuid"
)

type webhookCreatePayload struct {
	ServiceID  string
	EndpointID int
}

func (payload *webhookCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.ServiceID) {
		return portainer.Error("Invalid ServiceID")
	}
	if govalidator.IsNull(string(payload.EndpointID)) {
		return portainer.Error("Invalid EndpointID")
	}
	if payload.EndpointID < 1 {
		return portainer.Error("Invalid EndpointID " + string(payload.EndpointID))
	}
	return nil
}

func (handler *Handler) webhookCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload webhookCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	webhook, err := handler.WebhookService.WebhookByServiceID(payload.ServiceID)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "An error occurred retrieving webhooks from the database", err}
	}
	if webhook != nil {
		return &httperror.HandlerError{http.StatusConflict, "A webhook for this service already exists", portainer.ErrWebhookAlreadyExists}
	}

	token, err := uuid.NewV4()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error creating unique token", err}
	}

	webhook = &portainer.Webhook{
		Token:      token.String(),
		ServiceID:  payload.ServiceID,
		EndpointID: portainer.EndpointID(payload.EndpointID),
	}

	err = handler.WebhookService.CreateWebhook(webhook)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the webhook inside the database", err}
	}

	return response.JSON(w, webhook)
}
