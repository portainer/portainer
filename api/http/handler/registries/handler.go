package registries

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/security"

	"net/http"

	"github.com/gorilla/mux"
)

func hideFields(registry *portainer.Registry) {
	registry.Password = ""
}

// Handler is the HTTP handler used to handle registry operations.
type Handler struct {
	*mux.Router
	RegistryService portainer.RegistryService
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
	h.Handle("/registries/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.registryDelete))).Methods(http.MethodDelete)

	return h
}
