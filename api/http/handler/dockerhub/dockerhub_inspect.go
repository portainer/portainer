package dockerhub

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// dockerhubInspect
// @summary Gets the dockerhub settings
// @description
// @tags dockerhub
// @security ApiKeyAuth
// @accept json
// @produce json
// @success 200 {object} portainer.DockerHub
// @failure 500
// @router /dockerhub [get]
func (handler *Handler) dockerhubInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	dockerhub, err := handler.DataStore.DockerHub().DockerHub()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve DockerHub details from the database", err}
	}

	hideFields(dockerhub)
	return response.JSON(w, dockerhub)
}
