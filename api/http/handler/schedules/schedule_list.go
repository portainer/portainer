package schedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"

	"github.com/portainer/portainer"
)

func listSchedulesMock() ([]*portainer.Schedule, error) {
	return mockSchedules, nil
}

func (handler *Handler) listSchedules(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	schedules, err := listSchedulesMock()

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve schedules from the database", err}
	}

	return response.JSON(w, schedules)
}
