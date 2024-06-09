package settings

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

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

	adminRouter := h.NewRoute().Subrouter()
	adminRouter.Use(bouncer.AdminAccess)
	adminRouter.Handle("/settings", httperror.LoggerHandler(h.settingsUpdate)).Methods(http.MethodPut)

	authenticatedRouter := h.NewRoute().Subrouter()
	authenticatedRouter.Use(bouncer.AuthenticatedAccess)
	authenticatedRouter.Handle("/settings", httperror.LoggerHandler(h.settingsInspect)).Methods(http.MethodGet)

	publicRouter := h.NewRoute().Subrouter()
	publicRouter.Use(bouncer.PublicAccess)
	publicRouter.Handle("/settings/public", httperror.LoggerHandler(h.settingsPublic)).Methods(http.MethodGet)

	return h
}
