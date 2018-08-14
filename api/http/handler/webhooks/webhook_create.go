package webhooks

//TODO
// * Generate random string for TokenData for added security

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")

// Used for generating random token

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
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve webhook from the database", err}
	}
	if webhook != nil {
		return &httperror.HandlerError{http.StatusConflict, "A webhook with the same name already exists", portainer.ErrWebhookAlreadyExists}
	}

	token := "foo1234" //Replace with random token

	webhook = &portainer.Webhook{
		TokenData:  token,
		ServiceID:  payload.ServiceID,
		EndpointID: portainer.EndpointID(payload.EndpointID),
	}

	err = handler.WebhookService.CreateWebhook(webhook)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the webhook inside the database", err}
	}

	return response.JSON(w, webhook)
}

// func randSeq(n int)
