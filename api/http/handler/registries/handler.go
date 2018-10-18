package registries

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"
)

func hideFields(registry *portainer.Registry) {
	registry.Password = ""
	registry.ManagementConfiguration = portainer.RegistryManagementConfiguration{}
}

// Handler is the HTTP handler used to handle registry operations.
type Handler struct {
	*mux.Router
	RegistryService portainer.RegistryService
	FileService     portainer.FileService

	// TODO: remove proxymanager ?
	ProxyManager *proxy.Manager
}

// NewHandler creates a handler to manage registry operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/registries",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.registryCreate))).Methods(http.MethodPost)
	h.Handle("/registries",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.registryList))).Methods(http.MethodGet)
	h.Handle("/registries/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.registryInspect))).Methods(http.MethodGet)
	h.Handle("/registries/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.registryUpdate))).Methods(http.MethodPut)
	h.Handle("/registries/{id}/access",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.registryUpdateAccess))).Methods(http.MethodPut)
	h.Handle("/registries/{id}/configure",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.registryConfigure))).Methods(http.MethodPost)
	h.Handle("/registries/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.registryDelete))).Methods(http.MethodDelete)
	h.PathPrefix("/registries/{id}/v2").Handler(
		bouncer.PublicAccess(httperror.LoggerHandler(h.proxyRequestsToRegistryAPI)))

	return h
}
