package schedules

import (
	"net/http"

	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
)

func (handler *Handler) scheduleInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
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

	return response.JSON(w, schedule)
}
