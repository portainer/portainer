package registries

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/errors"
)

// request on /api/registries/:id/v2
func (handler *Handler) proxyRequestsToRegistryAPI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	registry, err := handler.DataStore.Registry().Registry(portainer.RegistryID(registryID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.RegistryAccess(r, registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access registry", errors.ErrEndpointAccessDenied}
	}

	managementConfiguration := registry.ManagementConfiguration
	if managementConfiguration == nil {
		managementConfiguration = createDefaultManagementConfiguration(registry)
	}

	key := strconv.Itoa(int(registryID))

	forceCreate := false
	forceNew := r.Header.Get("X-RegistryManagement-ForceNew")
	if forceNew != "" {
		forceCreate = true
	}

	proxy, err := handler.registryProxyService.GetProxy(key, registry.URL, managementConfiguration, forceCreate)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create registry proxy", err}
	}

	http.StripPrefix("/registries/"+key, proxy).ServeHTTP(w, r)
	return nil
}

func createDefaultManagementConfiguration(registry *portainer.Registry) *portainer.RegistryManagementConfiguration {
	config := &portainer.RegistryManagementConfiguration{
		Type: registry.Type,
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
	}

	if registry.Authentication {
		config.Authentication = true
		config.Username = registry.Username
		config.Password = registry.Password
	}

	return config
}
