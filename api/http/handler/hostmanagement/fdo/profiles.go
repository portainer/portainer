package fdo

import (
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"net/http"
	"time"

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
	/*settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}*/

	// TODO get from DB
	profiles := []portainer.FDOProfile{
		{
			ID:          1,
			Name:        "Default Device Profile",
			DateCreated: time.Now().Unix(),
		},
		{
			ID:          2,
			Name:        "k8s Profile",
			DateCreated: time.Now().Unix() - 5000,
		},
		{
			ID:          3,
			Name:        "Swarm Profile",
			DateCreated: time.Now().Unix() + 5000,
		},
	}

	return response.JSON(w, profiles)
}
