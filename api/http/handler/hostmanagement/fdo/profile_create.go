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

// @id createProfile
// @summary creates a new FDO Profile
// @description creates a new FDO Profile
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 409 "Profile name already exists"
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
	return &httperror.HandlerError{http.StatusBadRequest, "Invalid method. Value must be one of: editor", errors.New("invalid method")}
}

func (handler *Handler) createFDOProfileFromFileContent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload createProfileFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	isUnique, err := handler.checkUniqueProfileName(payload.Name, -1)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}
	if !isUnique {
		return &httperror.HandlerError{http.StatusConflict, fmt.Sprintf("A profile with the name '%s' already exists", payload.Name), errors.New("a profile already exists with this name")}
	}

	profileID := handler.DataStore.FDOProfile().GetNextIdentifier()
	profile := &portainer.FDOProfile{
		ID:   portainer.FDOProfileID(profileID),
		Name: payload.Name,
	}

	filePath, err := handler.FileService.StoreFDOProfileFileFromBytes(strconv.Itoa(int(profile.ID)), []byte(payload.ProfileFileContent))
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
