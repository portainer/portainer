package database

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle webhook operations.
type Handler struct {
	*mux.Router
	DatabaseService portainer.DatabaseService
	FileService portainer.FileService
}

// NewHandler creates a handler to manage settings operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/database",
		//bouncer.RestrictedAccess(httperror.LoggerHandler(h.databaseExport))).Methods(http.MethodGet)
		bouncer.PublicAccess(httperror.LoggerHandler(h.databaseExport))).Methods(http.MethodGet)
	return h
}
