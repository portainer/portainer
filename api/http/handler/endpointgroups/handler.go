package endpointgroups

import (
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/authorization"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle environment(endpoint) group operations.
type Handler struct {
	*mux.Router
	AuthorizationService *authorization.Service
	DataStore            dataservices.DataStore
}

// NewHandler creates a handler to manage environment(endpoint) group operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Use(bouncer.AdminAccess)

	h.Handle("/endpoint_groups", httperror.LoggerHandler(h.endpointGroupCreate)).Methods(http.MethodPost)
	h.Handle("/endpoint_groups", httperror.LoggerHandler(h.endpointGroupList)).Methods(http.MethodGet)
	h.Handle("/endpoint_groups/{id}", httperror.LoggerHandler(h.endpointGroupInspect)).Methods(http.MethodGet)
	h.Handle("/endpoint_groups/{id}", httperror.LoggerHandler(h.endpointGroupUpdate)).Methods(http.MethodPut)
	h.Handle("/endpoint_groups/{id}", httperror.LoggerHandler(h.endpointGroupDelete)).Methods(http.MethodDelete)
	h.Handle("/endpoint_groups/{id}/endpoints/{endpointId}", httperror.LoggerHandler(h.endpointGroupAddEndpoint)).Methods(http.MethodPut)
	h.Handle("/endpoint_groups/{id}/endpoints/{endpointId}", httperror.LoggerHandler(h.endpointGroupDeleteEndpoint)).Methods(http.MethodDelete)
	return h
}
