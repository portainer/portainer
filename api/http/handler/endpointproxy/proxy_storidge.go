package endpointproxy

// TODO: legacy extension management

import (
	"errors"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"

	"net/http"
)

func (handler *Handler) proxyRequestsToStoridgeAPI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	var storidgeExtension *portainer.EndpointExtension
	for _, extension := range endpoint.Extensions {
		if extension.Type == portainer.StoridgeEndpointExtension {
			storidgeExtension = &extension
		}
	}

	if storidgeExtension == nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Storidge extension not supported on this environment", errors.New("This extension is not supported")}
	}

	proxyExtensionKey := strconv.Itoa(endpointID) + "_" + strconv.Itoa(int(portainer.StoridgeEndpointExtension)) + "_" + storidgeExtension.URL

	var proxy http.Handler
	proxy = handler.ProxyManager.GetLegacyExtensionProxy(proxyExtensionKey)
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateLegacyExtensionProxy(proxyExtensionKey, storidgeExtension.URL)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create extension proxy", err}
		}
	}

	id := strconv.Itoa(endpointID)
	http.StripPrefix("/"+id+"/storidge", proxy).ServeHTTP(w, r)
	return nil
}
