package schedules

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainererrors "github.com/portainer/portainer/api/internal/errors"
)

// GET request on /api/schedules
func (handler *Handler) scheduleList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to retrieve settings", err}
	}
	if !settings.EnableHostManagementFeatures {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Host management features are disabled", errors.New(portainererrors.ErrHostManagementFeaturesDisabled)}
	}

	schedules, err := handler.DataStore.Schedule().Schedules()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve schedules from the database", err}
	}

	return response.JSON(w, schedules)
}
