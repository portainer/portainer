package endpointproxy

import (
	"strconv"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/security"

	"net/http"
)

func (handler *Handler) proxyRequestsToStoridgeAPI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.Role != portainer.AdministratorRole {
		err = handler.checkEndpointAccess(endpoint, tokenData.ID)
		if err != nil && err == portainer.ErrEndpointAccessDenied {
			return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", portainer.ErrEndpointAccessDenied}
		} else if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to verify permission to access endpoint", err}
		}
	}

	var storidgeExtension *portainer.EndpointExtension
	for _, extension := range endpoint.Extensions {
		if extension.Type == portainer.StoridgeEndpointExtension {
			storidgeExtension = &extension
		}
	}

	if storidgeExtension == nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Storidge extension not supported on this endpoint", portainer.ErrEndpointExtensionNotSupported}
	}

	proxyExtensionKey := string(endpoint.ID) + "_" + string(portainer.StoridgeEndpointExtension)

	var proxy http.Handler
	proxy = handler.ProxyManager.GetExtensionProxy(proxyExtensionKey)
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateAndRegisterExtensionProxy(proxyExtensionKey, storidgeExtension.URL)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create extension proxy", err}
		}
	}

	id := strconv.Itoa(endpointID)
	http.StripPrefix("/"+id+"/extensions/storidge", proxy).ServeHTTP(w, r)
	return nil
}
