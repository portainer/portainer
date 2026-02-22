package backupschedules

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
	h.Handle("/backup_schedules",
		bouncer.AdminAccess(httperror.LoggerHandler(h.backupScheduleCreate))).Methods(http.MethodPost)
	h.Handle("/backup_schedules",
		bouncer.AdminAccess(httperror.LoggerHandler(h.backupScheduleList))).Methods(http.MethodGet)
	h.Handle("/backup_schedules/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.backupScheduleInspect))).Methods(http.MethodGet)
	h.Handle("/backup_schedules/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.backupScheduleUpdate))).Methods(http.MethodPut)
	h.Handle("/backup_schedules/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.backupScheduleDelete))).Methods(http.MethodDelete)

	return h
}

type backupScheduleCreatePayload struct {
	Name          string
	EndpointID    portainer.EndpointID
	Schedule      string
	Include       []string
	Exclude       []string
	Retention     portainer.RetentionPolicy
	TargetType    string
	TargetDetails map[string]any
}

func (payload *backupScheduleCreatePayload) Validate(r *http.Request) error {
	if len(payload.Name) == 0 {
		return errors.New("invalid name")
	}
	if payload.EndpointID == 0 {
		return errors.New("invalid endpoint ID")
	}
	if len(payload.Schedule) == 0 {
		return errors.New("invalid schedule")
	}
	if _, err := cron.ParseStandard(payload.Schedule); err != nil {
		return errors.New("invalid cron schedule expression")
	}
	return nil
}

func (h *Handler) backupScheduleCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload backupScheduleCreatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	schedule := &portainer.BackupSchedule{
		Name:          payload.Name,
		EndpointID:    payload.EndpointID,
		Schedule:      payload.Schedule,
		Include:       payload.Include,
		Exclude:       payload.Exclude,
		Retention:     payload.Retention,
		TargetType:    payload.TargetType,
		TargetDetails: payload.TargetDetails,
		Created:       time.Now().Unix(),
	}

	err := h.DataStore.BackupSchedule().Create(schedule)
	if err != nil {
		return httperror.InternalServerError("Unable to create backup schedule", err)
	}

	if err := h.JobScheduler.CreateBackupSchedule(*schedule); err != nil {
		return httperror.InternalServerError("Unable to schedule backup job", err)
	}

	return response.JSON(w, schedule)
}

func (h *Handler) backupScheduleList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	schedules, err := h.DataStore.BackupSchedule().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve backup schedules", err)
	}

	return response.JSON(w, schedules)
}

func (h *Handler) backupScheduleInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid schedule identifier route variable", err)
	}

	schedule, err := h.DataStore.BackupSchedule().Read(portainer.BackupScheduleID(id))
	if h.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find backup schedule", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find backup schedule", err)
	}

	return response.JSON(w, schedule)
}

type backupScheduleUpdatePayload struct {
	Name          string
	Schedule      string
	Include       []string
	Exclude       []string
	Retention     portainer.RetentionPolicy
	TargetType    string
	TargetDetails map[string]any
}

func (payload *backupScheduleUpdatePayload) Validate(r *http.Request) error {
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

func (h *Handler) backupScheduleUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid schedule identifier route variable", err)
	}

	var payload backupScheduleUpdatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	schedule, err := h.DataStore.BackupSchedule().Read(portainer.BackupScheduleID(id))
	if h.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find backup schedule", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find backup schedule", err)
	}

	schedule.Name = payload.Name
	schedule.Schedule = payload.Schedule
	schedule.Include = payload.Include
	schedule.Exclude = payload.Exclude
	schedule.Retention = payload.Retention
	schedule.TargetType = payload.TargetType
	schedule.TargetDetails = payload.TargetDetails

	err = h.DataStore.BackupSchedule().Update(schedule.ID, schedule)
	if err != nil {
		return httperror.InternalServerError("Unable to update backup schedule", err)
	}

	if err := h.JobScheduler.UpdateBackupSchedule(*schedule); err != nil {
		return httperror.InternalServerError("Unable to update scheduled backup job", err)
	}

	return response.JSON(w, schedule)
}

func (h *Handler) backupScheduleDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid schedule identifier route variable", err)
	}

	err = h.DataStore.BackupSchedule().Delete(portainer.BackupScheduleID(id))
	if err != nil {
		return httperror.InternalServerError("Unable to delete backup schedule", err)
	}

	h.JobScheduler.DeleteBackupSchedule(portainer.BackupScheduleID(id))

	return response.Empty(w)
}
