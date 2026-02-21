package replicationschedules

import (
	"errors"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/scheduler"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/robfig/cron/v3"
)

type Handler struct {
	*mux.Router
	DataStore    dataservices.DataStore
	JobScheduler *scheduler.JobScheduler
}

func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/replication_schedules",
		bouncer.AdminAccess(httperror.LoggerHandler(h.replicationScheduleCreate))).Methods(http.MethodPost)
	h.Handle("/replication_schedules",
		bouncer.AdminAccess(httperror.LoggerHandler(h.replicationScheduleList))).Methods(http.MethodGet)
	h.Handle("/replication_schedules/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.replicationScheduleInspect))).Methods(http.MethodGet)
	h.Handle("/replication_schedules/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.replicationScheduleUpdate))).Methods(http.MethodPut)
	h.Handle("/replication_schedules/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.replicationScheduleDelete))).Methods(http.MethodDelete)

	return h
}

type replicationScheduleCreatePayload struct {
	Name     string
	SourceID portainer.EndpointID
	TargetID portainer.EndpointID
	Schedule string
	Include  []string
	Exclude  []string
}

func (payload *replicationScheduleCreatePayload) Validate(r *http.Request) error {
	if len(payload.Name) == 0 {
		return errors.New("invalid name")
	}
	if payload.SourceID == 0 {
		return errors.New("invalid source ID")
	}
	if payload.TargetID == 0 {
		return errors.New("invalid target ID")
	}
	if len(payload.Schedule) == 0 {
		return errors.New("invalid schedule")
	}
	if _, err := cron.ParseStandard(payload.Schedule); err != nil {
		return errors.New("invalid cron schedule expression")
	}
	return nil
}

func (h *Handler) replicationScheduleCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload replicationScheduleCreatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	schedule := &portainer.ReplicationSchedule{
		Name:     payload.Name,
		SourceID: payload.SourceID,
		TargetID: payload.TargetID,
		Schedule: payload.Schedule,
		Include:  payload.Include,
		Exclude:  payload.Exclude,
		Created:  time.Now().Unix(),
	}

	err := h.DataStore.ReplicationSchedule().Create(schedule)
	if err != nil {
		return httperror.InternalServerError("Unable to create replication schedule", err)
	}

	if err := h.JobScheduler.CreateReplicationSchedule(*schedule); err != nil {
		return httperror.InternalServerError("Unable to schedule replication job", err)
	}

	return response.JSON(w, schedule)
}

func (h *Handler) replicationScheduleList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	schedules, err := h.DataStore.ReplicationSchedule().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve replication schedules", err)
	}

	return response.JSON(w, schedules)
}

func (h *Handler) replicationScheduleInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid schedule identifier route variable", err)
	}

	schedule, err := h.DataStore.ReplicationSchedule().Read(portainer.ReplicationScheduleID(id))
	if h.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find replication schedule", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find replication schedule", err)
	}

	return response.JSON(w, schedule)
}

type replicationScheduleUpdatePayload struct {
	Name     string
	Schedule string
	Include  []string
	Exclude  []string
}

func (payload *replicationScheduleUpdatePayload) Validate(r *http.Request) error {
	if len(payload.Name) == 0 {
		return errors.New("invalid name")
	}
	if len(payload.Schedule) == 0 {
		return errors.New("invalid schedule")
	}
	if _, err := cron.ParseStandard(payload.Schedule); err != nil {
		return errors.New("invalid cron schedule expression")
	}
	return nil
}

func (h *Handler) replicationScheduleUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid schedule identifier route variable", err)
	}

	var payload replicationScheduleUpdatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	schedule, err := h.DataStore.ReplicationSchedule().Read(portainer.ReplicationScheduleID(id))
	if h.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find replication schedule", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find replication schedule", err)
	}

	schedule.Name = payload.Name
	schedule.Schedule = payload.Schedule
	schedule.Include = payload.Include
	schedule.Exclude = payload.Exclude

	err = h.DataStore.ReplicationSchedule().Update(schedule.ID, schedule)
	if err != nil {
		return httperror.InternalServerError("Unable to update replication schedule", err)
	}

	if err := h.JobScheduler.UpdateReplicationSchedule(*schedule); err != nil {
		return httperror.InternalServerError("Unable to update scheduled replication job", err)
	}

	return response.JSON(w, schedule)
}

func (h *Handler) replicationScheduleDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid schedule identifier route variable", err)
	}

	err = h.DataStore.ReplicationSchedule().Delete(portainer.ReplicationScheduleID(id))
	if err != nil {
		return httperror.InternalServerError("Unable to delete replication schedule", err)
	}

	h.JobScheduler.DeleteReplicationSchedule(portainer.ReplicationScheduleID(id))

	return response.Empty(w)
}
