package fdo

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

// @id fdoProfiles
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
func (handler *Handler) fdoProfiles(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	profiles, err := handler.DataStore.FDOProfile().FDOProfiles()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: err.Error(), Err: err}
	}

	return response.JSON(w, profiles)
}

type createProfileFromFileContentPayload struct {
	Name               string
	ProfileFileContent string
}

func (payload *createProfileFromFileContentPayload) Validate(r *http.Request) error {
	if payload.Name == "" {
		return errors.New("profile name must be provided")
	}

	if payload.ProfileFileContent == "" {
		return errors.New("profile file content must be provided")
	}

	return nil
}

// @id createProfiles
// @summary creates a new FDO Profile
// @description creates a new FDO Profile
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /fdo/profiles [post]
func (handler *Handler) createProfile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method", err}
	}

	switch method {
	case "editor":
		return handler.createFDOProfileFromFileContent(w, r)
	}
	return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid method. Value must be one of: editor", Err: errors.New("invalid method")}
}

func (handler *Handler) createFDOProfileFromFileContent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload createProfileFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	isUnique, err := handler.checkUniqueProfileName(payload.Name)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}
	if !isUnique {
		return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: fmt.Sprintf("A profile with the name '%s' already exists", payload.Name), Err: errors.New("a profile already exists with this name")}
	}

	profileID := handler.DataStore.FDOProfile().GetNextIdentifier()
	profile := &portainer.FDOProfile{
		ID:   portainer.FDOProfileID(profileID),
		Name: payload.Name,
	}

	filePath, err := handler.FileService.StoreFDOProfileFileFromBytes(strconv.Itoa(int(profile.ID)), payload.Name, []byte(payload.ProfileFileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist profile file on disk", err}
	}
	profile.FilePath = filePath
	profile.DateCreated = time.Now().Unix()

	err = handler.DataStore.FDOProfile().Create(profile)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the profile inside the database", err}
	}

	return response.JSON(w, profile)
}

func (handler *Handler) checkUniqueProfileName(name string) (bool, error) {
	profiles, err := handler.DataStore.FDOProfile().FDOProfiles()
	if err != nil {
		return false, err
	}

	for _, profile := range profiles {
		if profile.Name == name {
			return false, nil
		}
	}

	return true, nil
}
