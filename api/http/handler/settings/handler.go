package settings

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle settings operations.
type Handler struct {
	*mux.Router
	SettingsService portainer.SettingsService
	LDAPService     portainer.LDAPService
	FileService     portainer.FileService
	JobScheduler    portainer.JobScheduler
}

// NewHandler creates a handler to manage settings operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/settings",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.settingsInspect))).Methods(http.MethodGet)
	h.Handle("/settings",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.settingsUpdate))).Methods(http.MethodPut)
	h.Handle("/settings/public",
		bouncer.PublicAccess(httperror.LoggerHandler(h.settingsPublic))).Methods(http.MethodGet)
	h.Handle("/settings/authentication/checkLDAP",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.settingsLDAPCheck))).Methods(http.MethodPut)

	return h
}
