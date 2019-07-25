package schedules

import (
	"errors"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

func (handler *Handler) scheduleDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to retrieve settings", err}
	}
	if !settings.EnableHostManagementFeatures {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Host management features are disabled", portainer.ErrHostManagementFeaturesDisabled}
	}

	scheduleID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid schedule identifier route variable", err}
	}

	schedule, err := handler.ScheduleService.Schedule(portainer.ScheduleID(scheduleID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a schedule with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a schedule with the specified identifier inside the database", err}
	}

	if schedule.JobType == portainer.SnapshotJobType || schedule.JobType == portainer.EndpointSyncJobType {
		return &httperror.HandlerError{http.StatusBadRequest, "Cannot remove system schedules", errors.New("Cannot remove system schedule")}
	}

	scheduleFolder := handler.FileService.GetScheduleFolder(strconv.Itoa(scheduleID))
	err = handler.FileService.RemoveDirectory(scheduleFolder)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the files associated to the schedule on the filesystem", err}
	}

	handler.ReverseTunnelService.RemoveSchedule(schedule.ID)

	handler.JobScheduler.UnscheduleJob(schedule.ID)

	err = handler.ScheduleService.DeleteSchedule(portainer.ScheduleID(scheduleID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the schedule from the database", err}
	}

	return response.Empty(w)
}
