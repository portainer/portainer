package scenes

import (
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"net/http"

	"github.com/portainer/libhttp/request"
)

type sceneUpdatePayload struct {
	Name        string `example:"my-scenes" validate:"required"`
	Description string `example:"Scene description"`
}

func (payload *sceneUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// @id SceneUpdate
// @summary Update a Scene
// @description Update a Scene
// @description **Access policy**: administrator
// @tags scenes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Scene identifier"
// @param body body sceneUpdatePayload true "Scene details"
// @success 200 {object} portainer.Scene "Success"
// @failure 400 "Invalid request"
// @failure 404 "Scene not found"
// @failure 500 "Server error"
// @router /scenes/{id} [put]
func (handler *Handler) sceneUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	sceneID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid scenes identifier route variable", err}
	}

	var payload sceneUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	scene, err := handler.DataStore.Scene().Scene(sceneID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a scenes with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a scenes with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		scene.Name = payload.Name
	}

	if payload.Description != "" {
		scene.Description = payload.Description
	}

	err = handler.DataStore.Scene().UpdateScene(scene.ID, scene)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist scenes changes inside the database", err}
	}
	return response.JSON(w, scene)
}
