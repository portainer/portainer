package settings

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id SettingsPublic
// @summary Retrieve Portainer public settings
// @description Retrieve public settings. Returns a small set of settings that are not reserved to administrators only.
// @description **Access policy**: public
// @tags settings
// @produce json
// @success 200 {object} publicSettingsResponse "Success"
// @failure 500 "Server error"
// @router /settings/public [get]
func (handler *Handler) settingsPublic(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve the settings from the database", err)
	}

	publicSettings := generatePublicSettings(settings)
	return response.JSON(w, publicSettings)
}
