package edgejobtasks

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
	DataStore   portainer.DataStore
	FileService portainer.FileService
}

// NewHandler creates a handler to manage Edge job operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/edge_jobs/{id}/tasks",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobTasksList))).Methods(http.MethodGet)
	h.Handle("/edge_jobs/{id}/tasks/{taskID}/logs",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobTaskLogsInspect))).Methods(http.MethodGet)
	h.Handle("/edge_jobs/{id}/tasks/{taskID}/logs",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobTasksCollect))).Methods(http.MethodPost)
	h.Handle("/edge_jobs/{id}/tasks/{taskID}/logs",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeJobTasksClear))).Methods(http.MethodDelete)
	return h
}
