package endpointproxy

import (
	"errors"
	"fmt"
	"strings"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"

	"net/http"
)

func (handler *Handler) proxyRequestsToKubernetesAPI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	if endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment {
		if endpoint.EdgeID == "" {
			return &httperror.HandlerError{http.StatusInternalServerError, "No Edge agent registered with the endpoint", errors.New("No agent available")}
		}

		tunnel := handler.ReverseTunnelService.GetTunnelDetails(endpoint.ID)
		if tunnel.Status == portainer.EdgeAgentIdle {
			handler.ProxyManager.DeleteEndpointProxy(endpoint)

			err := handler.ReverseTunnelService.SetTunnelStatusToRequired(endpoint.ID)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update tunnel status", err}
			}

			settings, err := handler.DataStore.Settings().Settings()
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
			}

			waitForAgentToConnect := time.Duration(settings.EdgeAgentCheckinInterval) * time.Second
			time.Sleep(waitForAgentToConnect * 2)
		}
	}

	var proxy http.Handler
	proxy = handler.ProxyManager.GetEndpointProxy(endpoint)
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateAndRegisterEndpointProxy(endpoint)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create proxy", err}
		}
	}

	requestPrefix := fmt.Sprintf("/%d/kubernetes", endpointID)
	if endpoint.Type == portainer.AgentOnKubernetesEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment {
		if isKubernetesRequest(strings.TrimPrefix(r.URL.String(), requestPrefix)) {
			requestPrefix = fmt.Sprintf("/%d", endpointID)
		}
	}

	http.StripPrefix(requestPrefix, proxy).ServeHTTP(w, r)
	return nil
}

func isKubernetesRequest(requestURL string) bool {
	return strings.HasPrefix(requestURL, "/api")
}
