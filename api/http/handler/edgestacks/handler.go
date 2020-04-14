package edgestacks

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle endpoint group operations.
type Handler struct {
	*mux.Router
	AuthorizationService *portainer.AuthorizationService
	EdgeStackService     portainer.EdgeStackService
	FileService          portainer.FileService
	GitService           portainer.GitService
}

// NewHandler creates a handler to manage endpoint group operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/edge_stacks",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeStackCreate))).Methods(http.MethodPost)
	h.Handle("/edge_stacks",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeStackList))).Methods(http.MethodGet)
	h.Handle("/edge_stacks/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeStackInspect))).Methods(http.MethodGet)
	h.Handle("/edge_stacks/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeStackUpdate))).Methods(http.MethodPut)
	h.Handle("/edge_stacks/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeStackDelete))).Methods(http.MethodDelete)
	h.Handle("/edge_stacks/{id}/file",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeStackFile))).Methods(http.MethodGet)
	h.Handle("/edge_stacks/{id}/status",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeStackStatusUpdate))).Methods(http.MethodPut)
	return h
}
