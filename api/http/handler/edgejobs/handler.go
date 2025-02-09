package edgejobs

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle Edge job operations.
type Handler struct {
	*mux.Router
	DataStore            dataservices.DataStore
	FileService          portainer.FileService
	ReverseTunnelService portainer.ReverseTunnelService
}

// NewHandler creates a handler to manage Edge job operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/edge_jobs",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobList)))).Methods(http.MethodGet)
	h.Handle("/edge_jobs/create/{method}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobCreate)))).Methods(http.MethodPost)
	h.Handle("/edge_jobs/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobInspect)))).Methods(http.MethodGet)
	h.Handle("/edge_jobs/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobUpdate)))).Methods(http.MethodPut)
	h.Handle("/edge_jobs/{id}",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobDelete)))).Methods(http.MethodDelete)
	h.Handle("/edge_jobs/{id}/file",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobFile)))).Methods(http.MethodGet)
	h.Handle("/edge_jobs/{id}/tasks",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobTasksList)))).Methods(http.MethodGet)
	h.Handle("/edge_jobs/{id}/tasks/{taskID}/logs",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobTaskLogsInspect)))).Methods(http.MethodGet)
	h.Handle("/edge_jobs/{id}/tasks/{taskID}/logs",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobTasksCollect)))).Methods(http.MethodPost)
	h.Handle("/edge_jobs/{id}/tasks/{taskID}/logs",
		bouncer.AdminAccess(bouncer.EdgeComputeOperation(httperror.LoggerHandler(h.edgeJobTasksClear)))).Methods(http.MethodDelete)

	return h
}

func convertEndpointsToMetaObject(endpoints []portainer.EndpointID) map[portainer.EndpointID]portainer.EdgeJobEndpointMeta {
	endpointsMap := map[portainer.EndpointID]portainer.EdgeJobEndpointMeta{}

	for _, endpointID := range endpoints {
		endpointsMap[endpointID] = portainer.EdgeJobEndpointMeta{}
	}

	return endpointsMap
}

func txResponse(w http.ResponseWriter, r any, err error) *httperror.HandlerError {
	if err != nil {
		var handlerError *httperror.HandlerError
		if errors.As(err, &handlerError) {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.JSON(w, r)
}
