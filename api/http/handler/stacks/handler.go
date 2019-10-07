package stacks

import (
	"net/http"
	"sync"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle stack operations.
type Handler struct {
	stackCreationMutex *sync.Mutex
	stackDeletionMutex *sync.Mutex
	requestBouncer     *security.RequestBouncer
	*mux.Router
	FileService            portainer.FileService
	GitService             portainer.GitService
	StackService           portainer.StackService
	EndpointService        portainer.EndpointService
	ResourceControlService portainer.ResourceControlService
	RegistryService        portainer.RegistryService
	DockerHubService       portainer.DockerHubService
	SwarmStackManager      portainer.SwarmStackManager
	ComposeStackManager    portainer.ComposeStackManager
	SettingsService        portainer.SettingsService
}

// NewHandler creates a handler to manage stack operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		stackCreationMutex: &sync.Mutex{},
		stackDeletionMutex: &sync.Mutex{},
		requestBouncer:     bouncer,
	}
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackCreate))).Methods(http.MethodPost)
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackList))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackInspect))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackDelete))).Methods(http.MethodDelete)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackUpdate))).Methods(http.MethodPut)
	h.Handle("/stacks/{id}/file",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackFile))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}/migrate",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackMigrate))).Methods(http.MethodPost)
	return h
}
