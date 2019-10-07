package endpoints

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/security"

	"net/http"

	"github.com/gorilla/mux"
)

const (
	// ErrEndpointManagementDisabled is an error raised when trying to access the endpoints management endpoints
	// when the server has been started with the --external-endpoints flag
	ErrEndpointManagementDisabled = portainer.Error("Endpoint management is disabled")
)

func hideFields(endpoint *portainer.Endpoint) {
	endpoint.AzureCredentials = portainer.AzureCredentials{}
	if len(endpoint.Snapshots) > 0 {
		endpoint.Snapshots[0].SnapshotRaw = portainer.SnapshotRaw{}
	}
}

// Handler is the HTTP handler used to handle endpoint operations.
type Handler struct {
	*mux.Router
	authorizeEndpointManagement bool
	requestBouncer              *security.RequestBouncer
	EndpointService             portainer.EndpointService
	EndpointGroupService        portainer.EndpointGroupService
	FileService                 portainer.FileService
	ProxyManager                *proxy.Manager
	Snapshotter                 portainer.Snapshotter
	JobService                  portainer.JobService
	ReverseTunnelService        portainer.ReverseTunnelService
	SettingsService             portainer.SettingsService
	AuthorizationService        *portainer.AuthorizationService
}

// NewHandler creates a handler to manage endpoint operations.
func NewHandler(bouncer *security.RequestBouncer, authorizeEndpointManagement bool) *Handler {
	h := &Handler{
		Router:                      mux.NewRouter(),
		authorizeEndpointManagement: authorizeEndpointManagement,
		requestBouncer:              bouncer,
	}

	h.Handle("/endpoints",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointCreate))).Methods(http.MethodPost)
	h.Handle("/endpoints/snapshot",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointSnapshots))).Methods(http.MethodPost)
	h.Handle("/endpoints",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.endpointList))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.endpointInspect))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointUpdate))).Methods(http.MethodPut)
	h.Handle("/endpoints/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointDelete))).Methods(http.MethodDelete)
	h.Handle("/endpoints/{id}/extensions",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.endpointExtensionAdd))).Methods(http.MethodPost)
	h.Handle("/endpoints/{id}/extensions/{extensionType}",
		bouncer.RestrictedAccess(httperror.LoggerHandler(h.endpointExtensionRemove))).Methods(http.MethodDelete)
	h.Handle("/endpoints/{id}/job",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointJob))).Methods(http.MethodPost)
	h.Handle("/endpoints/{id}/snapshot",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointSnapshot))).Methods(http.MethodPost)
	h.Handle("/endpoints/{id}/status",
		bouncer.PublicAccess(httperror.LoggerHandler(h.endpointStatusInspect))).Methods(http.MethodGet)

	return h
}
