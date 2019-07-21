package endpointproxy

import (
	"errors"
	"strconv"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer/api"

	"net/http"
)

func (handler *Handler) proxyRequestsToDockerAPI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	// TODO: review all code related to Edge cases in that function
	if endpoint.Type != portainer.EdgeAgentEnvironment && endpoint.Status == portainer.EndpointStatusDown {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to query endpoint", errors.New("Endpoint is down")}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint, true)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	if endpoint.Type == portainer.EdgeAgentEnvironment {
		state, _, _ := handler.ReverseTunnelService.GetTunnelState(endpoint.ID)
		if state == portainer.EdgeAgentIdle {
			handler.ProxyManager.DeleteProxy(endpoint)
			handler.ReverseTunnelService.UpdateTunnelState(endpoint.ID, portainer.EdgeAgentManagementRequired)

			settings, err := handler.SettingsService.Settings()
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
			}

			waitForAgentToConnect := time.Duration(settings.EdgeAgentCheckinInterval) * time.Second
			time.Sleep(waitForAgentToConnect * 2)
		}
	}

	var proxy http.Handler
	proxy = handler.ProxyManager.GetProxy(endpoint)
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateAndRegisterProxy(endpoint)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create proxy", err}
		}
	}

	id := strconv.Itoa(endpointID)
	http.StripPrefix("/"+id+"/docker", proxy).ServeHTTP(w, r)
	return nil
}
