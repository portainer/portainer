package registries

import (
	"encoding/json"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer/api"
)

// request on /api/registries/{id}/proxies/gitlab
func (handler *Handler) proxyRequestsToGitlabAPIWithRegistry(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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

	err = handler.requestBouncer.RegistryAccess(r, registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access registry", portainer.ErrEndpointAccessDenied}
	}

	extension, err := handler.ExtensionService.Extension(portainer.RegistryManagementExtension)
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Registry management extension is not enabled", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	var proxy http.Handler
	proxy = handler.ProxyManager.GetExtensionProxy(portainer.RegistryManagementExtension)
	if proxy == nil {
		proxy, err = handler.ProxyManager.CreateExtensionProxy(portainer.RegistryManagementExtension)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create extension proxy for registry manager", err}
		}
	}

	config := &portainer.RegistryManagementConfiguration{
		Type:     portainer.GitlabRegistry,
		Password: registry.Password,
	}

	encodedConfiguration, err := json.Marshal(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to encode management configuration", err}
	}

	id := strconv.Itoa(int(registryID))
	r.Header.Set("X-RegistryManagement-Key", id+"-gitlab")
	r.Header.Set("X-RegistryManagement-URI", registry.Gitlab.InstanceURL)
	r.Header.Set("X-RegistryManagement-Config", string(encodedConfiguration))
	r.Header.Set("X-PortainerExtension-License", extension.License.LicenseKey)

	http.StripPrefix("/registries/"+id+"/proxies/gitlab", proxy).ServeHTTP(w, r)
	return nil
}
