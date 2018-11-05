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

	updateTaskSchedule := updateSchedule(schedule, &payload)
	if updateTaskSchedule {
		taskContext := handler.createTaskExecutionContext(schedule.ID, schedule.Endpoints)
		schedule.Task.(cron.ScriptTask).SetContext(taskContext)

		err := handler.JobScheduler.UpdateScheduledTask(schedule.ID, schedule.CronExpression, schedule.Task)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update task scheduler", err}
		}
	}

	err = handler.ScheduleService.UpdateSchedule(portainer.ScheduleID(scheduleID), schedule)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist schedule changes inside the database", err}
	}

	return response.JSON(w, schedule)
}

func updateSchedule(schedule *portainer.Schedule, payload *scheduleUpdatePayload) bool {
	updateTaskSchedule := false

	if payload.Name != nil {
		schedule.Name = *payload.Name
	}

	if payload.Endpoints != nil {
		schedule.Endpoints = payload.Endpoints
		updateTaskSchedule = true
	}

	if payload.CronExpression != nil {
		schedule.CronExpression = *payload.CronExpression
		updateTaskSchedule = true
	}

	if payload.Image != nil {
		t := schedule.Task.(cron.ScriptTask)
		t.Image = *payload.Image

		updateTaskSchedule = true
	}

	return updateTaskSchedule
}
