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

	err = handler.scheduleService.DeleteSchedule(portainer.ScheduleID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed deleting schedule", err}
	}

	return response.Empty(w)
}
