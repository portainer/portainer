package templates

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

const (
	containerTemplatesURLLinuxServerIo = "https://tools.linuxserver.io/portainer.json"
)

// Handler represents an HTTP API handler for managing templates.
type Handler struct {
	*mux.Router
	SettingsService portainer.SettingsService
}

// NewHandler returns a new instance of Handler.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/templates",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.templateList))).Methods(http.MethodGet)
	return h
}
