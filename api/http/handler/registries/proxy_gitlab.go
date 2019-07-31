package registries

import (
	"encoding/json"
	"net/http"
	"errors"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
)

// request on /api/registries/proxies/gitlab
func (handler *Handler) proxyRequestsToGitlabAPI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	domain := r.Header.Get("X-RegistryManagement-URI")
	if domain == "" {
		return &httperror.HandlerError{http.StatusInternalServerError, "No gitlab registry specified", errors.New("No gitlab registry specified")}
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
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to register registry proxy", err}
		}
	}

	config := &portainer.RegistryManagementConfiguration{
		Type: portainer.GitlabRegistry,
	}

	encodedConfiguration, err := json.Marshal(config)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to encode management configuration", err}
	}

	r.Header.Set("X-RegistryManagement-Key", "gitlab")
	r.Header.Set("X-RegistryManagement-Config", string(encodedConfiguration))
	r.Header.Set("X-PortainerExtension-License", extension.License.LicenseKey)

	http.StripPrefix("/registries/proxies/gitlab", proxy).ServeHTTP(w, r)
	return nil
}
