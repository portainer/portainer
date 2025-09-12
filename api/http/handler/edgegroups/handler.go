package edgegroups

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle environment(endpoint) group operations.
type Handler struct {
	*mux.Router
	DataStore            dataservices.DataStore
	ReverseTunnelService portainer.ReverseTunnelService
}

// NewHandler creates a handler to manage environment(endpoint) group operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/edge_groups",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeGroupCreate)))).Methods(http.MethodPost)
	h.Handle("/edge_groups",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeGroupList)))).Methods(http.MethodGet)
	h.Handle("/edge_groups/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeGroupInspect)))).Methods(http.MethodGet)
	h.Handle("/edge_groups/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeGroupUpdate)))).Methods(http.MethodPut)
	h.Handle("/edge_groups/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeGroupDelete)))).Methods(http.MethodDelete)

	return h
}
