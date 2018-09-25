package plugins

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle plugin operations.
type Handler struct {
	*mux.Router
	PluginService portainer.PluginService
	ProxyManager  *proxy.Manager
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

	return h
}
