package extensions

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/orcaman/concurrent-map"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle extension operations.
type Handler struct {
	*mux.Router
	ExtensionService   portainer.ExtensionService
	FileService     portainer.FileService
	ProxyManager    *proxy.Manager
	ExtensionProcesses *cmap.ConcurrentMap
}

// NewHandler creates a handler to manage extension operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/extensions",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.extensionList))).Methods(http.MethodGet)
	h.Handle("/extensions",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.extensionCreate))).Methods(http.MethodPost)
	h.Handle("/extensions/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.extensionInspect))).Methods(http.MethodGet)
	h.Handle("/extensions/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.extensionDelete))).Methods(http.MethodDelete)
	h.Handle("/extensions/{id}/update",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.extensionUpdate))).Methods(http.MethodPost)

	return h
}
