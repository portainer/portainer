package edgestacks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	edgestackservice "github.com/portainer/portainer/api/internal/edge/edgestacks"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle environment(endpoint) group operations.
type Handler struct {
	*mux.Router
	requestBouncer     security.BouncerService
	DataStore          dataservices.DataStore
	FileService        portainer.FileService
	GitService         portainer.GitService
	edgeStacksService  *edgestackservice.Service
	KubernetesDeployer portainer.KubernetesDeployer
}

// NewHandler creates a handler to manage environment(endpoint) group operations.
func NewHandler(bouncer security.BouncerService, dataStore dataservices.DataStore, edgeStacksService *edgestackservice.Service) *Handler {
	h := &Handler{
		Router:            mux.NewRouter(),
		requestBouncer:    bouncer,
		DataStore:         dataStore,
		edgeStacksService: edgeStacksService,
	}

	h.Handle("/edge_stacks/create/{method}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeStackCreate)))).Methods(http.MethodPost)
	h.Handle("/edge_stacks",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeStackList)))).Methods(http.MethodGet)
	h.Handle("/edge_stacks/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeStackInspect)))).Methods(http.MethodGet)
	h.Handle("/edge_stacks/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeStackUpdate)))).Methods(http.MethodPut)
	h.Handle("/edge_stacks/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeStackDelete)))).Methods(http.MethodDelete)
	h.Handle("/edge_stacks/{id}/file",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeStackFile)))).Methods(http.MethodGet)
	h.Handle("/edge_stacks/{id}/status",
		bouncer.PublicAccess(httperror.LoggerHandler(h.edgeStackStatusUpdate))).Methods(http.MethodPut)

	edgeStackStatusRouter := h.NewRoute().Subrouter()
	edgeStackStatusRouter.Use(middlewares.WithEndpoint(h.DataStore.Endpoint(), "endpoint_id"))

	return h
}

func handlerDBErr(err error, msg string) *httperror.HandlerError {
	httpErr := httperror.InternalServerError(msg, err)

	if dataservices.IsErrObjectNotFound(err) {
		httpErr.StatusCode = http.StatusNotFound
	}

	return httpErr
}
