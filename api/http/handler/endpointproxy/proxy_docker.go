package endpointproxy

import (
	"errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"strconv"
	"strings"

	"net/http"
)

func (handler *Handler) proxyRequestsToDockerAPI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	if endpoint.Type == portainer.EdgeAgentOnDockerEnvironment {
		if endpoint.EdgeID == "" {
			return &httperror.HandlerError{http.StatusInternalServerError, "No Edge agent registered with the environment", errors.New("No agent available")}
		}

		_, err := handler.ReverseTunnelService.GetActiveTunnel(endpoint)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to get the active tunnel", err}
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

	id := strconv.Itoa(endpointID)

	prefix := "/" + id + "/agent/docker"
	if !strings.HasPrefix(r.URL.Path, prefix) {
		prefix = "/" + id + "/docker"
	}

	http.StripPrefix(prefix, proxy).ServeHTTP(w, r)
	return nil
}
