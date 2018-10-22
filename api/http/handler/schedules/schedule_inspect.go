package schedules

import (
	"net/http"

	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
)

func (handler *Handler) inspectSchedule(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: id", err}
	}

	schedule, err := findSchedule(portainer.ScheduleID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Schedule not found", err}
	}
	return response.JSON(w, schedule)
}

func findSchedule(id portainer.ScheduleID) (*portainer.Schedule, error) {
	if 0 <= int(id) && int(id) < len(mockSchedules) {
		return mockSchedules[id], nil
	}
	return nil, portainer.Error("Schedule not found")
}
