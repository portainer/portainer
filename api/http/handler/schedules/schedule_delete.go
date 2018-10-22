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

	err = deleteScheduleMock(portainer.ScheduleID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed deleting schedule", err}
	}

	return response.JSON(w, nil)
}

func deleteScheduleMock(id portainer.ScheduleID) error {
	if 0 > int(id) || int(id) > len(mockSchedules) {
		return portainer.Error("Schedule not found")
	}
	mockSchedules = append(mockSchedules[:int(id)], mockSchedules[int(id)+1:]...)
	return nil
}
