package fdo

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id fdoProfileList
// @summary retrieves all FDO profiles
// @description retrieves all FDO profiles
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
func (handler *Handler) fdoProfileList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	profiles, err := handler.DataStore.FDOProfile().FDOProfiles()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	return response.JSON(w, profiles)
}
