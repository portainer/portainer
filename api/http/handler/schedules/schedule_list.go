package schedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/schedules
func (handler *Handler) scheduleList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	schedules, err := handler.ScheduleService.Schedules()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve schedules from the database", err}
	}

	return response.JSON(w, schedules)
}
