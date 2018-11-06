package schedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/cron"
)

type scheduleUpdatePayload struct {
	Name           *string
	Image          *string
	CronExpression *string
	Endpoints      []portainer.EndpointID
}

func (payload *scheduleUpdatePayload) Validate(r *http.Request) error {
	return nil
}

func (handler *Handler) scheduleUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	scheduleID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid schedule identifier route variable", err}
	}

	var payload scheduleUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	schedule, err := handler.ScheduleService.Schedule(portainer.ScheduleID(scheduleID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a schedule with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a schedule with the specified identifier inside the database", err}
	}

	updateJobSchedule := updateSchedule(schedule, &payload)
	if updateJobSchedule {

		jobContext := cron.NewScriptExecutionJobContext(handler.JobService, handler.EndpointService, handler.FileService)
		jobRunner := cron.NewScriptExecutionJobRunner(schedule.ScriptExecutionJob, jobContext)
		err := handler.JobScheduler.UpdateSchedule(schedule, jobRunner)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update job scheduler", err}
		}
	}

	err = handler.ScheduleService.UpdateSchedule(portainer.ScheduleID(scheduleID), schedule)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist schedule changes inside the database", err}
	}

	return response.JSON(w, schedule)
}

func updateSchedule(schedule *portainer.Schedule, payload *scheduleUpdatePayload) bool {
	updateJobSchedule := false

	if payload.Name != nil {
		schedule.Name = *payload.Name
	}

	if payload.Endpoints != nil {
		schedule.ScriptExecutionJob.Endpoints = payload.Endpoints
		updateJobSchedule = true
	}

	if payload.CronExpression != nil {
		schedule.CronExpression = *payload.CronExpression
		updateJobSchedule = true
	}

	if payload.Image != nil {
		schedule.ScriptExecutionJob.Image = *payload.Image
		updateJobSchedule = true
	}

	return updateJobSchedule
}
