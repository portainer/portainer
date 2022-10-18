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
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid scenes identifier route variable", Err: err}
	}

	var payload sceneUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	scene, err := handler.DataStore.Scene().Scene(sceneID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find a scenes with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find a scenes with the specified identifier inside the database", Err: err}
	}

	if payload.Name != "" {
		scene.Name = payload.Name
	}

	if payload.Description != "" {
		scene.Description = payload.Description
	}

	err = handler.DataStore.Scene().UpdateScene(scene.ID, scene)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist scenes changes inside the database", Err: err}
	}
	return response.JSON(w, scene)
}
