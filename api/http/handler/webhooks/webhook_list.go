package webhooks

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type webhookListOperationFilters struct {
	ServiceID  string `json:"ServiceID"`
	EndpointID int    `json:"EndpointID"`
}

// GET request on /api/webhooks?(filters=<filters>)
func (handler *Handler) webhookList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var filters webhookListOperationFilters
	err := request.RetrieveJSONQueryParameter(r, "filters", &filters, true)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: filters", err}
	}

	webhooks, err := handler.WebhookService.Webhooks()
	webhooks = filterWebhooks(webhooks, &filters)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve webhooks from the database", err}
	}

	return response.JSON(w, webhooks)
}

func filterWebhooks(webhooks []portainer.Webhook, filters *webhookListOperationFilters) []portainer.Webhook {
	if filters.EndpointID == 0 && filters.ServiceID == "" {
		return webhooks
	}

	filteredWebhooks := make([]portainer.Webhook, 0, len(webhooks))
	for _, webhook := range webhooks {
		if webhook.EndpointID == portainer.EndpointID(filters.EndpointID) && webhook.ServiceID == string(filters.ServiceID) {
			filteredWebhooks = append(filteredWebhooks, webhook)
		}
	}

	return filteredWebhooks
}
