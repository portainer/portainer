package schedules

import (
	"errors"
	"net/http"

	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	portainererrors "github.com/portainer/portainer/api/internal/errors"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
)

func (handler *Handler) scheduleInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to retrieve settings", err}
	}
	if !settings.EnableHostManagementFeatures {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Host management features are disabled", errors.New(portainererrors.ErrHostManagementFeaturesDisabled)}
	}

	scheduleID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid schedule identifier route variable", err}
	}

	schedule, err := handler.DataStore.Schedule().Schedule(portainer.ScheduleID(scheduleID))
	if err.Error() == portainererrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a schedule with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a schedule with the specified identifier inside the database", err}
	}

	return response.JSON(w, schedule)
}
