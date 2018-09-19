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
	status       *portainer.Status
	ProxyManager *proxy.Manager
}

// NewHandler creates a handler to manage plugin operations.
func NewHandler(bouncer *security.RequestBouncer, status *portainer.Status) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
		status: status,
	}

	// TODO: admin restricted
	h.Handle("/plugins",
		bouncer.PublicAccess(httperror.LoggerHandler(h.pluginList))).Methods(http.MethodGet)
	h.Handle("/plugins",
		bouncer.PublicAccess(httperror.LoggerHandler(h.pluginCreate))).Methods(http.MethodPost)

	return h
}
