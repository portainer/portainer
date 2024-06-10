package settings

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id SettingsPublic
// @summary Retrieve the public settings of the Portainer instance
// @description Get the settings of the Portainer instance. Will return only a subset of settings.
// @tags settings
// @produce json
// @success 200 {object} publicSettingsResponse "The settings object"
// @failure 500 "Server error occurred while attempting to retrieve the settings."
// @router /settings/public [get]
func (handler *Handler) settingsPublic(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve the settings from the database", err)
	}

	publicSettings := generatePublicSettings(settings)
	return response.JSON(w, publicSettings)
}
