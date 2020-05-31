package edgejobs

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle Edge job operations.
type Handler struct {
	*mux.Router
	DataStore            portainer.DataStore
	FileService          portainer.FileService
	ReverseTunnelService portainer.ReverseTunnelService
}

// NewHandler creates a handler to manage Edge job operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/edge_jobs",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobList))).Methods(http.MethodGet)
	h.Handle("/edge_jobs",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobCreate))).Methods(http.MethodPost)
	h.Handle("/edge_jobs/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobInspect))).Methods(http.MethodGet)
	h.Handle("/edge_jobs/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobUpdate))).Methods(http.MethodPut)
	h.Handle("/edge_jobs/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobDelete))).Methods(http.MethodDelete)
	h.Handle("/edge_jobs/{id}/file",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobFile))).Methods(http.MethodGet)
	return h
}
