package settings

import (
	"github.com/portainer/portainer/api/internal/authorization"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/snapshot"
)

func hideFields(settings *portainer.Settings) {
	settings.LDAPSettings.Password = ""
	settings.OAuthSettings.ClientSecret = ""
}

// Handler is the HTTP handler used to handle settings operations.
type Handler struct {
	*mux.Router
	AuthorizationService *authorization.Service
	DataStore            portainer.DataStore
	FileService          portainer.FileService
	JWTService           portainer.JWTService
	LDAPService          portainer.LDAPService
	SnapshotService      *snapshot.Service
}

// NewHandler creates a handler to manage settings operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/settings",
		bouncer.AdminAccess(httperror.LoggerHandler(h.settingsInspect))).Methods(http.MethodGet)
	h.Handle("/settings",
		bouncer.AdminAccess(httperror.LoggerHandler(h.settingsUpdate))).Methods(http.MethodPut)
	h.Handle("/settings/public",
		bouncer.PublicAccess(httperror.LoggerHandler(h.settingsPublic))).Methods(http.MethodGet)
	h.Handle("/settings/authentication/checkLDAP",
		bouncer.AdminAccess(httperror.LoggerHandler(h.settingsLDAPCheck))).Methods(http.MethodPut)

	return h
}
