package plugins

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/orcaman/concurrent-map"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle plugin operations.
type Handler struct {
	*mux.Router
	PluginService   portainer.PluginService
	FileService     portainer.FileService
	ProxyManager    *proxy.Manager
	PluginProcesses *cmap.ConcurrentMap
}

// NewHandler creates a handler to manage plugin operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	//TODO: admin access

	h.Handle("/plugins",
		bouncer.PublicAccess(httperror.LoggerHandler(h.pluginList))).Methods(http.MethodGet)
	h.Handle("/plugins",
		bouncer.PublicAccess(httperror.LoggerHandler(h.pluginCreate))).Methods(http.MethodPost)
	h.Handle("/plugins/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.pluginInspect))).Methods(http.MethodGet)
	h.Handle("/plugins/{id}/update",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.pluginUpdate))).Methods(http.MethodPost)

	return h
}
