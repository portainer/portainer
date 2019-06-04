package schedules

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type scheduleFileResponse struct {
	ScheduleFileContent string `json:"ScheduleFileContent"`
}

// GET request on /api/schedules/:id/file
func (handler *Handler) scheduleFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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

	if schedule.JobType != portainer.ScriptExecutionJobType {
		return &httperror.HandlerError{http.StatusBadRequest, "Unable to retrieve script file", errors.New("This type of schedule do not have any associated script file")}
	}

	scheduleFileContent, err := handler.FileService.GetFileContent(schedule.ScriptExecutionJob.ScriptPath)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve schedule script file from disk", err}
	}

	return response.JSON(w, &scheduleFileResponse{ScheduleFileContent: string(scheduleFileContent)})
}
