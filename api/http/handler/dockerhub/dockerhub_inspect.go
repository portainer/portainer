package dockerhub

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id DockerHubInspect
// @summary Retrieve DockerHub information
// @description Use this endpoint to retrieve the information used to connect to the DockerHub
// @description **Access policy**: authenticated
// @tags dockerhub
// @security jwt
// @produce json
// @success 200 {object} portainer.DockerHub
// @failure 500 "Server error"
// @router /dockerhub [get]
func (handler *Handler) dockerhubInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	dockerhub, err := handler.DataStore.DockerHub().DockerHub()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve DockerHub details from the database", err}
	}

	hideFields(dockerhub)
	return response.JSON(w, dockerhub)
}
