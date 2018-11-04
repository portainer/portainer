package schedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

func (handler *Handler) scheduleDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	scheduleId, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid schedule identifier route variable", err}
	}

	handler.JobScheduler.UnscheduleTask(portainer.ScheduleID(scheduleId))

	scheduleFolder := handler.FileService.GetScheduleFolder(portainer.ScheduleID(scheduleId))
	err = handler.FileService.RemoveDirectory(scheduleFolder)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the files associated to the schedule on the filesystem", err}
	}

	err = handler.ScheduleService.DeleteSchedule(portainer.ScheduleID(scheduleId))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the schedule from the database", err}
	}

	return response.Empty(w)
}
