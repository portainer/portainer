package templates

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler represents an HTTP API handler for managing templates.
type Handler struct {
	*mux.Router
	DataStore   dataservices.DataStore
	GitService  portainer.GitService
	FileService portainer.FileService
}

// NewHandler returns a new instance of Handler.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/templates",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.templateList))).Methods(http.MethodGet)
	h.Handle("/templates/{id}/file",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.templateFile))).Methods(http.MethodPost)
	return h
}
