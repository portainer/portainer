package schedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

func (handler *Handler) deleteSchedule(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: id", err}
	}
	scheduleId := portainer.ScheduleID(id)
	err = handler.scheduleService.DeleteSchedule(scheduleId)

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed deleting schedule", err}
	}

	handler.scheduler.UnscheduleScriptJob(scheduleId)

	err = handler.fileService.RemoveDirectory(handler.fileService.GetScheduleProjectPath(scheduleId))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed deleting schedule file", err}
	}

	return response.Empty(w)
}
