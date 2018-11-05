package schedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

func (handler *Handler) scheduleDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	scheduleID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid schedule identifier route variable", err}
	}

	handler.JobScheduler.UnscheduleTask(portainer.ScheduleID(scheduleID))

	scheduleFolder := handler.FileService.GetScheduleFolder(portainer.ScheduleID(scheduleID))
	err = handler.FileService.RemoveDirectory(scheduleFolder)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the files associated to the schedule on the filesystem", err}
	}

	err = handler.ScheduleService.DeleteSchedule(portainer.ScheduleID(scheduleID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the schedule from the database", err}
	}

	return response.Empty(w)
}
