package settings

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id SettingsInspect
// @summary Retrieve Portainer settings
// @description Retrieve Portainer settings.
// @description **Access policy**: administrator
// @tags settings
// @security jwt
// @produce json
// @success 200 {object} portainer.Settings "Success"
// @failure 500 "Server error"
// @router /settings [get]
func (handler *Handler) settingsInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve the settings from the database", err}
	}

	hideFields(settings)
	return response.JSON(w, settings)
}
