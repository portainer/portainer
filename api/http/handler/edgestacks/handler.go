package edgestacks

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	edgestackservice "github.com/portainer/portainer/api/internal/edge/edgestacks"
)

// Handler is the HTTP handler used to handle environment(endpoint) group operations.
type Handler struct {
	*mux.Router
	requestBouncer     *security.RequestBouncer
	DataStore          dataservices.DataStore
	FileService        portainer.FileService
	GitService         portainer.GitService
	edgeStacksService  *edgestackservice.Service
	KubernetesDeployer portainer.KubernetesDeployer
}

// NewHandler creates a handler to manage environment(endpoint) group operations.
func NewHandler(bouncer *security.RequestBouncer, dataStore dataservices.DataStore, edgeStacksService *edgestackservice.Service) *Handler {
	h := &Handler{
		Router:            mux.NewRouter(),
		requestBouncer:    bouncer,
		DataStore:         dataStore,
		edgeStacksService: edgeStacksService,
	}

	h.Handle("/edge_stacks",
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

	edgeStackStatusRouter.PathPrefix("/edge_stacks/{id}/status/{endpoint_id}").Handler(bouncer.PublicAccess(httperror.LoggerHandler(h.edgeStackStatusDelete))).Methods(http.MethodDelete)

	return h
}

func (handler *Handler) convertAndStoreKubeManifestIfNeeded(stackFolder string, projectPath, composePath string, relatedEndpointIds []portainer.EndpointID) (manifestPath string, err error) {
	hasKubeEndpoint, err := hasKubeEndpoint(handler.DataStore.Endpoint(), relatedEndpointIds)
	if err != nil {
		return "", fmt.Errorf("unable to check if edge stack has kube environments: %w", err)
	}

	if !hasKubeEndpoint {
		return "", nil
	}

	composeConfig, err := handler.FileService.GetFileContent(projectPath, composePath)
	if err != nil {
		return "", fmt.Errorf("unable to retrieve Compose file from disk: %w", err)
	}

	kompose, err := handler.KubernetesDeployer.ConvertCompose(composeConfig)
	if err != nil {
		return "", fmt.Errorf("failed converting compose file to kubernetes manifest: %w", err)
	}

	komposeFileName := filesystem.ManifestFileDefaultName
	_, err = handler.FileService.StoreEdgeStackFileFromBytes(stackFolder, komposeFileName, kompose)
	if err != nil {
		return "", fmt.Errorf("failed to store kube manifest file: %w", err)
	}

	return komposeFileName, nil
}
