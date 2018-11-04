package schedules

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/cron"
	"github.com/portainer/portainer/http/security"
)

// Handler is the HTTP handler used to handle schedule operations.
type Handler struct {
	*mux.Router
	ScheduleService portainer.ScheduleService
	EndpointService portainer.EndpointService
	FileService     portainer.FileService
	JobService      portainer.JobService
	JobScheduler    portainer.JobScheduler
}

// NewHandler creates a handler to manage schedule operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Handle("/schedules",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.scheduleList))).Methods(http.MethodGet)
	h.Handle("/schedules",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.scheduleCreate))).Methods(http.MethodPost)
	h.Handle("/schedules/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.scheduleInspect))).Methods(http.MethodGet)
	h.Handle("/schedules/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.scheduleUpdate))).Methods(http.MethodPut)
	h.Handle("/schedules/{id}",
		bouncer.AdministratorAccess(httperror.LoggerHandler(h.scheduleDelete))).Methods(http.MethodDelete)

	return h
}

func (handler *Handler) createTaskExecutionContext(scheduleID portainer.ScheduleID, endpoints []portainer.EndpointID) *cron.ScriptTaskContext {
	return &cron.ScriptTaskContext{
		JobService:      handler.JobService,
		EndpointService: handler.EndpointService,
		FileService:     handler.FileService,
		ScheduleID:      scheduleID,
		TargetEndpoints: endpoints,
	}
}
