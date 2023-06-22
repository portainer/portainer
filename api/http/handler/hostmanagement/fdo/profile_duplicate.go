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

// @id duplicate
// @summary duplicated an existing FDO Profile
// @description duplicated an existing FDO Profile
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @param id path int true "FDO Profile identifier"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /fdo/profiles/{id}/duplicate [post]
func (handler *Handler) duplicateProfile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Bad request", errors.New("missing 'id' query parameter"))
	}

	originalProfile, err := handler.DataStore.FDOProfile().Read(portainer.FDOProfileID(id))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a FDO Profile with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a FDO Profile with the specified identifier inside the database", err)
	}

	fileContent, err := handler.FileService.GetFileContent(originalProfile.FilePath, "")
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Profile file content", err)
	}

	profileID := handler.DataStore.FDOProfile().GetNextIdentifier()
	if err != nil {
		return httperror.InternalServerError("Unable to duplicate Profile", err)
	}

	newProfile := &portainer.FDOProfile{
		ID:   portainer.FDOProfileID(profileID),
		Name: fmt.Sprintf("%s - copy", originalProfile.Name),
	}

	filePath, err := handler.FileService.StoreFDOProfileFileFromBytes(strconv.Itoa(int(newProfile.ID)), fileContent)
	if err != nil {
		return httperror.InternalServerError("Unable to persist profile file on disk", err)
	}
	newProfile.FilePath = filePath
	newProfile.DateCreated = time.Now().Unix()

	err = handler.DataStore.FDOProfile().Create(newProfile)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the profile inside the database", err)
	}

	return response.JSON(w, newProfile)
}
