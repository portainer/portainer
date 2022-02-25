package webhooks

import (
	"github.com/portainer/portainer/api/http/security"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type webhookListOperationFilters struct {
	ResourceID string `json:"ResourceID"`
	EndpointID int    `json:"EndpointID"`
}

// @summary List webhooks
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags webhooks
// @accept json
// @produce json
// @param filters query webhookListOperationFilters false "Filters"
// @success 200 {array} portainer.Webhook
// @failure 400
// @failure 500
// @router /webhooks [get]
func (handler *Handler) webhookList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var filters webhookListOperationFilters
	err := request.RetrieveJSONQueryParameter(r, "filters", &filters, true)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: filters", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve user info from request context", Err: err}
	}
	if !securityContext.IsAdmin {
		return response.JSON(w, []portainer.Webhook{})
	}

	webhooks, err := handler.DataStore.Webhook().Webhooks()
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
