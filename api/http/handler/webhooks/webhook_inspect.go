package webhooks

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

func (handler *Handler) webhookInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	serviceID, err := request.RetrieveRouteVariableValue(r, "serviceID")

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Missing service id parameter", err}
	}

	webhook, err := handler.WebhookService.WebhookByServiceID(serviceID)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve webhooks from the database", err}
	}

	if webhook == nil {
		//No webhook is probably normal if the user never set one up.
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find webhook for this service", err}
	}

	return response.JSON(w, webhook)

}
