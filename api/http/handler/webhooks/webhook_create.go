package webhooks

import (
	"errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils/access"
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/gofrs/uuid"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type webhookCreatePayload struct {
	ResourceID  string
	EndpointID  int
	RegistryID  portainer.RegistryID
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
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags webhooks
// @accept json
// @produce json
// @param body body webhookCreatePayload true "Webhook data"
// @success 200 {object} portainer.Webhook
// @failure 400
// @failure 409
// @failure 500
// @router /webhooks [post]
func (handler *Handler) webhookCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload webhookCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	webhook, err := handler.DataStore.Webhook().WebhookByResourceID(payload.ResourceID)
	if err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusInternalServerError, "An error occurred retrieving webhooks from the database", err}
	}
	if webhook != nil {
		return &httperror.HandlerError{http.StatusConflict, "A webhook for this resource already exists", errors.New("A webhook for this resource already exists")}
	}

	endpointID := portainer.EndpointID(payload.EndpointID)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve user info from request context", Err: err}
	}

	if !securityContext.IsAdmin {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Not authorized to create a webhook", Err: errors.New("not authorized to create a webhook")}
	}

	if payload.RegistryID != 0 {
		tokenData, err := security.RetrieveTokenData(r)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
		}

		_, err = access.GetAccessibleRegistry(handler.DataStore, tokenData.ID, endpointID, payload.RegistryID)
		if err != nil {
			return &httperror.HandlerError{http.StatusForbidden, "Permission deny to access registry", err}
		}
	}

	token, err := uuid.NewV4()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error creating unique token", err}
	}

	webhook = &portainer.Webhook{
		Token:       token.String(),
		ResourceID:  payload.ResourceID,
		EndpointID:  endpointID,
		RegistryID:  payload.RegistryID,
		WebhookType: portainer.WebhookType(payload.WebhookType),
	}

	err = handler.DataStore.Webhook().Create(webhook)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the webhook inside the database", err}
	}

	return response.JSON(w, webhook)
}
