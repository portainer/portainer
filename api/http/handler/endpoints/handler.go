package endpoints

import (
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/kubernetes/cli"

	"net/http"

	"github.com/gorilla/mux"
)

func hideFields(endpoint *portainer.Endpoint) {
	endpoint.AzureCredentials = portainer.AzureCredentials{}
	if len(endpoint.Snapshots) > 0 {
		endpoint.Snapshots[0].SnapshotRaw = portainer.DockerSnapshotRaw{}
	}
}

// This requestBouncer exists because security.RequestBounder is a type and not an interface.
// Therefore we can not swit	 it out with a dummy bouncer for go tests.  This interface works around it
type requestBouncer interface {
	AuthenticatedAccess(h http.Handler) http.Handler
	AdminAccess(h http.Handler) http.Handler
	RestrictedAccess(h http.Handler) http.Handler
	PublicAccess(h http.Handler) http.Handler
	AuthorizedEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error
	AuthorizedEdgeEndpointOperation(r *http.Request, endpoint *portainer.Endpoint) error
}

// Handler is the HTTP handler used to handle environment(endpoint) operations.
type Handler struct {
	*mux.Router
	requestBouncer       requestBouncer
	DataStore            dataservices.DataStore
	FileService          portainer.FileService
	ProxyManager         *proxy.Manager
	ReverseTunnelService portainer.ReverseTunnelService
	SnapshotService      portainer.SnapshotService
	K8sClientFactory     *cli.ClientFactory
	ComposeStackManager  portainer.ComposeStackManager
	AuthorizationService *authorization.Service
	BindAddress          string
	BindAddressHTTPS     string
}

// NewHandler creates a handler to manage environment(endpoint) operations.
func NewHandler(bouncer requestBouncer) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
	}

	h.Handle("/endpoints",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointCreate))).Methods(http.MethodPost)
	h.Handle("/endpoints/{id}/settings",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointSettingsUpdate))).Methods(http.MethodPut)
	h.Handle("/endpoints/{id}/association",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointAssociationDelete))).Methods(http.MethodDelete)
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
	h.Handle("/endpoints/{id}/dockerhub/{registryId}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.endpointDockerhubStatus))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}/snapshot",
		bouncer.AdminAccess(httperror.LoggerHandler(h.endpointSnapshot))).Methods(http.MethodPost)
	h.Handle("/endpoints/{id}/registries",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.endpointRegistriesList))).Methods(http.MethodGet)
	h.Handle("/endpoints/{id}/registries/{registryId}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.endpointRegistryAccess))).Methods(http.MethodPut)

	h.Handle("/endpoints/global-key", httperror.LoggerHandler(h.endpointCreateGlobalKey)).Methods(http.MethodPost)

	// DEPRECATED
	h.Handle("/endpoints/{id}/status", httperror.LoggerHandler(h.endpointStatusInspect)).Methods(http.MethodGet)

	return h
}
