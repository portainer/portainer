package settings

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
)

// GET request on /api/settings
func (handler *Handler) settingsInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve the settings from the database", err}
	}

	return response.JSON(w, settings)
}
