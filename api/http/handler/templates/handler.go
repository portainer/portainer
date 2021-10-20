package templates

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
)

// Handler represents an HTTP API handler for managing templates.
type Handler struct {
	*mux.Router
	DataStore   dataservices.DataStore
	GitService  portainer.GitService
	FileService portainer.FileService
}

// NewHandler returns a new instance of Handler.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/templates",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.templateList))).Methods(http.MethodGet)
	h.Handle("/templates/file",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.templateFile))).Methods(http.MethodPost)
	return h
}
