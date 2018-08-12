package webhooks

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
)

func (handler *Handler) webhookExecute(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	webhookID, err := request.RetrieveNumericRouteVariableValue(r, "id")

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Invalid service id parameter", err}
	}

	webhook, err := handler.WebhookService.Webhook(portainer.WebhookID(webhookID))
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve webhook from the database", err}
	}
	serviceID := webhook.ServiceID
	endpointID := webhook.EndpointID

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	var proxy http.Handler
	proxy = handler.ProxyManager.GetProxy(string(endpointID))
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateAndRegisterProxy(endpoint)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create proxy", err}
		}
	}

	url := "services/" + serviceID + "/update"

	dockerRequest, err := http.NewRequest("POST", url, nil)
	proxy.ServeHTTP(w, dockerRequest)
	return nil

}
