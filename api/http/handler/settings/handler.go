package settings

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

func hideFields(settings *portainer.Settings) {
	settings.LDAPSettings.Password = ""
	settings.OAuthSettings.ClientSecret = ""
	settings.OAuthSettings.KubeSecretKey = nil
}

// Handler is the HTTP handler used to handle settings operations.
type Handler struct {
	*mux.Router
	DataStore       dataservices.DataStore
	FileService     portainer.FileService
	JWTService      portainer.JWTService
	LDAPService     portainer.LDAPService
	SnapshotService portainer.SnapshotService
}

// NewHandler creates a handler to manage settings operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/settings",
		bouncer.AdminAccess(httperror.LoggerHandler(h.settingsInspect))).Methods(http.MethodGet)
	h.Handle("/settings",
		bouncer.AdminAccess(httperror.LoggerHandler(h.settingsUpdate))).Methods(http.MethodPut)
	h.Handle("/settings/public",
		bouncer.PublicAccess(httperror.LoggerHandler(h.settingsPublic))).Methods(http.MethodGet)

	return h
}
