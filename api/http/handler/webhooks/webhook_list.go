package webhooks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type webhookListOperationFilters struct {
	ResourceID string `json:"ResourceID"`
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
	if filters.EndpointID == 0 && filters.ResourceID == "" {
		return webhooks
	}

	filteredWebhooks := make([]portainer.Webhook, 0, len(webhooks))
	for _, webhook := range webhooks {
		if webhook.EndpointID == portainer.EndpointID(filters.EndpointID) && webhook.ResourceID == string(filters.ResourceID) {
			filteredWebhooks = append(filteredWebhooks, webhook)
		}
	}

	return filteredWebhooks
}
