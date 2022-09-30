package scenes

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"net/http"
)

// @summary Inspect a scenes
// @description Retrieve details abont a scenes.
// @description **Access policy**: administrator
// @tags scenes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "scenes identifier"
// @success 200 {object} portainer.Scene "Success"
// @failure 400 "Invalid request"
// @failure 404 "Scene not found"
// @failure 500 "Server error"
// @router /scenes/{id} [get]
func (handler *Handler) sceneInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	sceneID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid scenes identifier route variable", err}
	}

	scene, err := handler.DataStore.Scene().Scene(sceneID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a scenes with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a scenes with the specified identifier inside the database", err}
	}

	return response.JSON(w, scene)
}
