package templates

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"
)

// TODO: remove this
// const (
// containerTemplatesURLLinuxServerIo = "https://tools.linuxserver.io/portainer.json"
// )

// Handler represents an HTTP API handler for managing templates.
type Handler struct {
	*mux.Router
	// SettingsService portainer.SettingsService
	TemplateService portainer.TemplateService
}

// NewHandler returns a new instance of Handler.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/templates",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.templateList))).Methods(http.MethodGet)
	h.Handle("/templates",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.templateCreate))).Methods(http.MethodPost)
	h.Handle("/templates/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.templateInspect))).Methods(http.MethodGet)
	h.Handle("/templates/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.templateUpdate))).Methods(http.MethodPut)
	h.Handle("/templates/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.templateDelete))).Methods(http.MethodDelete)
	return h
}
