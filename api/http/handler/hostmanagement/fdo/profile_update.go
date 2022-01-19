package fdo

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @id updateProfile
// @summary updates an existing FDO Profile
// @description updates an existing FDO Profile
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 409 "Profile name already exists"
// @failure 500 "Server error"
// @router /fdo/profiles/{id} [put]
func (handler *Handler) updateProfile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Bad request", errors.New("missing 'id' query parameter")}
	}

	var payload createProfileFromFileContentPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	profile, err := handler.DataStore.FDOProfile().FDOProfile(portainer.FDOProfileID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Profile", err}
	}
	if profile == nil {
		return &httperror.HandlerError{http.StatusNotFound, "profile not found", errors.New("profile not found")}
	}

	isUnique, err := handler.checkUniqueProfileNameForUpdate(payload.Name, id)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}
	if !isUnique {
		return &httperror.HandlerError{http.StatusConflict, fmt.Sprintf("A profile with the name '%s' already exists", payload.Name), errors.New("a profile already exists with this name")}
	}

	filePath, err := handler.FileService.StoreFDOProfileFileFromBytes(strconv.Itoa(int(profile.ID)), []byte(payload.ProfileFileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update profile", err}
	}
	profile.FilePath = filePath
	profile.Name = payload.Name

	err = handler.DataStore.FDOProfile().Update(profile.ID, profile)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update profile", err}
	}

	return response.JSON(w, profile)
}

func (handler *Handler) checkUniqueProfileNameForUpdate(name string, id int) (bool, error) {
	profiles, err := handler.DataStore.FDOProfile().FDOProfiles()
	if err != nil {
		return false, err
	}

	for _, profile := range profiles {
		if profile.Name == name && int(profile.ID) != id {
			return false, nil
		}
	}

	return true, nil
}
