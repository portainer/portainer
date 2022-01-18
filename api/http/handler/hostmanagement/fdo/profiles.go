package fdo

import (
	"errors"
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

	// TODO mrydel check unique

	profileID := handler.DataStore.FDOProfile().GetNextIdentifier()
	profile := &portainer.FDOProfile{
		ID:   portainer.FDOProfileID(profileID),
		Name: payload.Name,
	}

	profileFolder := strconv.Itoa(int(profile.ID))
	filePath, err := handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist Compose file on disk", err}
	}
	profile.FilePath = filePath

	doCleanUp := true
	defer handler.cleanUp(stack, &doCleanUp)

	profile.DateCreated = time.Now().Unix()

	err = handler.DataStore.FDOProfile().Create(profile)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the profile inside the database", err}
	}

	doCleanUp = false
	return handler.decorateStackResponse(w, stack, userID)
}
