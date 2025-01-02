package webhooks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
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
// @param filters query string false "Filters (json-string)" example({"EndpointID":1,"ResourceID":"abc12345-abcd-2345-ab12-58005b4a0260"})
// @success 200 {array} portainer.Webhook
// @failure 400
// @failure 500
// @router /webhooks [get]
func (handler *Handler) webhookList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var filters webhookListOperationFilters
	err := request.RetrieveJSONQueryParameter(r, "filters", &filters, true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: filters", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user info from request context", err)
	}
	if !securityContext.IsAdmin {
		return response.JSON(w, []portainer.Webhook{})
	}

	webhooks, err := handler.DataStore.Webhook().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve webhooks from the database", err)
	}

	webhooks = filterWebhooks(webhooks, &filters)

	return response.JSON(w, webhooks)
}

func filterWebhooks(webhooks []portainer.Webhook, filters *webhookListOperationFilters) []portainer.Webhook {
	if filters.EndpointID == 0 && filters.ResourceID == "" {
		return webhooks
	}

	filteredWebhooks := make([]portainer.Webhook, 0, len(webhooks))
	for _, webhook := range webhooks {
		if webhook.EndpointID == portainer.EndpointID(filters.EndpointID) && webhook.ResourceID == filters.ResourceID {
			filteredWebhooks = append(filteredWebhooks, webhook)
		}
	}

	return filteredWebhooks
}
