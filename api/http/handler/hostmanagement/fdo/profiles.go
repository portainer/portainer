package fdo

import (
	"io"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
)

// @id fdoProfiles
// @summary retrieve a list of FDO profiles
// @description retrieve a list of FDO profiles
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @failure 500 "Bad gateway"
// @router /fdo/profiles [get]
func (handler *Handler) fdoProfiles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	profiles, err := http.Get(settings.FDOConfiguration.ProfilesURL)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadGateway, Message: "Unabled to retrieve the profile list", Err: err}
	}
	defer profiles.Body.Close()

	if _, err := io.Copy(w, profiles.Body); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadGateway, Message: "Unabled to retrieve the profile list", Err: err}
	}

	return nil
}
