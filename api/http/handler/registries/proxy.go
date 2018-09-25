package registries

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer"
)

// request on /api/registries/:id/v2
func (handler *Handler) proxyRequestsToRegistryAPI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	// TODO: should be updated

	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	//TODO: review that??
	var proxy http.Handler
	proxy = handler.ProxyManager.GetPluginProxy(portainer.RegistryManagementPlugin)
	if proxy == nil {
		// TODO: plugin check should not be done this way
		// return &httperror.HandlerError{http.StatusInternalServerError, "Registry management plugin is not enabled", errors.New("Plugin not enabled")}
		err = handler.ProxyManager.CreatePluginProxy(portainer.RegistryManagementPlugin)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to register registry proxy", err}
		}
		proxy = handler.ProxyManager.GetPluginProxy(portainer.RegistryManagementPlugin)
	}

	id := strconv.Itoa(int(registryID))
	r.Header.Set("X-RegistryManagement-Key", id)
	r.Header.Set("X-RegistryManagement-URI", registry.URL)

	//
	// var proxy http.Handler
	// proxy = handler.ProxyManager.GetRegistryProxy(id)
	// if proxy == nil {
	// 	proxy, err = handler.ProxyManager.CreateAndRegisterRegistryProxy(registry)
	// 	if err != nil {
	// 		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to register registry proxy", err}
	// 	}
	// }
	//
	http.StripPrefix("/registries/"+id, proxy).ServeHTTP(w, r)
	return nil
}
